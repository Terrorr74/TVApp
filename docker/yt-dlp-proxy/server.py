import json
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
}


def cors(response):
    for key, value in CORS_HEADERS.items():
        response.headers[key] = value
    return response


def yt_dlp_json(url: str) -> dict:
    """Fetch a single video's metadata."""
    result = subprocess.run(
        ['yt-dlp', '--dump-json', '--no-playlist', url],
        capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or 'yt-dlp failed')
    return json.loads(result.stdout)


def yt_dlp_playlist_json(url: str, limit: int = 30) -> dict:
    """Fetch a playlist/search result as a single JSON with 'entries'."""
    result = subprocess.run(
        ['yt-dlp', '--dump-single-json', '--flat-playlist',
         '--playlist-end', str(limit), url],
        capture_output=True, text=True, timeout=120
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or 'yt-dlp failed')
    return json.loads(result.stdout)


@app.after_request
def add_cors(response):
    return cors(response)


def _entry_to_video(e: dict, uploader_override: str = '') -> dict:
    thumbnail = e.get('thumbnail') or (e.get('thumbnails') or [{}])[-1].get('url', '')
    return {
        'url': f'/watch?v={e.get("id", "")}',
        'title': e.get('title', ''),
        'thumbnail': thumbnail,
        'uploaderName': e.get('uploader') or e.get('channel') or uploader_override,
        'uploaderUrl': f'/channel/{e.get("channel_id", "")}',
        'uploaderAvatar': None,
        'uploadedDate': e.get('upload_date', '') or e.get('upload_date_str', ''),
        'duration': int(e.get('duration') or 0),
        'views': int(e.get('view_count') or 0),
        'uploaderVerified': False,
        'shortDescription': (e.get('description') or '')[:200],
    }


@app.route('/trending')
def trending():
    try:
        # YouTube trending feed is geo-restricted from server IPs; use popular search as substitute
        info = yt_dlp_playlist_json('ytsearch30:trending music videos 2026', limit=30)
        entries = info.get('entries', [])
        return jsonify([_entry_to_video(e) for e in entries])
    except Exception as ex:
        return jsonify({'error': str(ex)}), 500


@app.route('/search')
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify({'items': [], 'nextpage': None, 'suggestion': None, 'corrected': False})
    try:
        info = yt_dlp_playlist_json(f'ytsearch20:{query}', limit=20)
        entries = info.get('entries', [])
        items = [{**_entry_to_video(e), 'type': 'stream'} for e in entries]
        return jsonify({'items': items, 'nextpage': None, 'suggestion': None, 'corrected': False})
    except Exception as ex:
        return jsonify({'error': str(ex)}), 500


@app.route('/streams/<video_id>')
def streams(video_id):
    try:
        info = yt_dlp_json(f'https://www.youtube.com/watch?v={video_id}')

        # 1. Prefer native HLS (m3u8) — works directly with hls.js
        hls_url = None
        for fmt in info.get('formats', []):
            if 'm3u8' in fmt.get('protocol', '') and fmt.get('vcodec', 'none') != 'none':
                hls_url = fmt.get('url')
                break

        # 2. Fall back to best combined mp4 (has both video + audio) — played via video.src
        if not hls_url:
            combined = [
                f for f in info.get('formats', [])
                if f.get('vcodec', 'none') != 'none'
                and f.get('acodec', 'none') != 'none'
                and f.get('ext') == 'mp4'
            ]
            if combined:
                # Pick highest resolution combined format
                combined.sort(key=lambda f: f.get('height', 0), reverse=True)
                hls_url = combined[0].get('url')

        related = []
        for e in info.get('entries', []):
            related.append({
                'url': f'/watch?v={e.get("id", "")}',
                'title': e.get('title', ''),
                'thumbnail': e.get('thumbnail', ''),
                'uploaderName': e.get('uploader', ''),
                'uploaderUrl': f'/channel/{e.get("channel_id", "")}',
                'uploaderAvatar': None,
                'uploadedDate': e.get('upload_date', ''),
                'duration': int(e.get('duration', 0)),
                'views': int(e.get('view_count', 0)),
                'uploaderVerified': False,
                'shortDescription': '',
            })

        result = {
            'title': info.get('title', ''),
            'description': info.get('description', ''),
            'uploadDate': info.get('upload_date', ''),
            'uploader': info.get('uploader', ''),
            'uploaderUrl': f'/channel/{info.get("channel_id", "")}',
            'uploaderAvatar': info.get('thumbnail', ''),
            'thumbnailUrl': info.get('thumbnail', ''),
            'hls': hls_url,
            'dash': None,
            'lbryId': None,
            'views': int(info.get('view_count', 0)),
            'likes': int(info.get('like_count', 0)),
            'dislikes': 0,
            'duration': int(info.get('duration', 0)),
            'uploaderSubscriberCount': int(info.get('channel_follower_count', 0)),
            'uploaderVerified': False,
            'audioStreams': [],
            'videoStreams': [],
            'relatedStreams': related,
            'chapters': [],
        }
        return jsonify(result)
    except Exception as ex:
        return jsonify({'error': str(ex)}), 500


@app.route('/channel/<channel_id>')
def channel(channel_id):
    try:
        info = yt_dlp_playlist_json(f'https://www.youtube.com/channel/{channel_id}/videos')
        channel_name = info.get('uploader') or info.get('channel') or info.get('title', '')
        entries = info.get('entries', [])
        avatar = info.get('thumbnail') or (info.get('thumbnails') or [{}])[-1].get('url', '')

        result = {
            'id': channel_id,
            'name': channel_name,
            'avatarUrl': avatar,
            'bannerUrl': None,
            'description': info.get('description', ''),
            'subscribers': int(info.get('channel_follower_count') or 0),
            'verified': False,
            'relatedStreams': [_entry_to_video(e, channel_name) for e in entries],
            'nextpage': None,
        }
        return jsonify(result)
    except Exception as ex:
        return jsonify({'error': str(ex)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8083, debug=False)
