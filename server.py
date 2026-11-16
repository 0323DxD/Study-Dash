#!/usr/bin/env python3
"""
Study Dash — Local Development & Mobile Testing Server.
Serves static files with proper MIME types for ES modules, PWA manifests, and service workers.
Displays local IP address so you can immediately play and install Study Dash on your Android or iPhone!
"""

import http.server
import socket
import socketserver
import os
import sys

PORT = 8080

# Ensure correct MIME types
mimes = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.css': 'text/css',
    '.html': 'text/html',
    '.svg': 'image/svg+xml',
    '.png': 'image/png'
}

class StudyDashHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow cross-origin and proper service worker scope
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        if ext in mimes:
            return mimes[ext]
        return super().guess_type(path)

def get_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return 'localhost'

if __name__ == '__main__':
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)

    lan_ip = get_lan_ip()

    print("=" * 60)
    print(" 🎮 STUDY DASH — Mobile-First Educational Endless Runner")
    print("=" * 60)
    print(f" Web Server running on Port {PORT}")
    print(f" • Local (PC Browser):   http://localhost:{PORT}")
    print(f" • Mobile (Phone / Wi-Fi): http://{lan_ip}:{PORT}")
    print("-" * 60)
    print(" Press Ctrl+C to stop the server.")
    print("=" * 60)

    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), StudyDashHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

