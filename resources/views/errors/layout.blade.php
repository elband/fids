<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('code') — FIDS · APT Pranoto AAP Samarinda</title>
    <link rel="icon" href="/favicon.ico">
    <style>
        :root {
            --accent: @yield('accent', '#f5b301');
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        body {
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
            color: #e6edf7;
            background: radial-gradient(120% 90% at 50% 16%, #14366e 0%, #0b1f45 45%, #050d23 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
        }
        /* dot pattern + glow */
        body::before {
            content: "";
            position: absolute; inset: 0;
            background-image: radial-gradient(circle, rgba(255,255,255,.9) 1px, transparent 1px);
            background-size: 46px 46px;
            opacity: .04;
            pointer-events: none;
        }
        body::after {
            content: "";
            position: absolute; top: -25%; left: 50%; transform: translateX(-50%);
            width: 60vw; height: 60vh; border-radius: 9999px;
            background: var(--accent);
            opacity: .12; filter: blur(130px);
            pointer-events: none;
        }
        .wrap { position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column; }

        /* Header brand */
        .brand {
            display: flex; align-items: center; gap: 14px;
            padding: 28px 36px;
        }
        .brand .globe {
            width: 52px; height: 52px; border-radius: 9999px;
            display: flex; align-items: center; justify-content: center;
            background: rgba(245,179,1,.10);
            box-shadow: inset 0 0 0 2px rgba(245,179,1,.4);
        }
        .brand h1 { font-size: 26px; font-weight: 900; letter-spacing: -.5px; line-height: 1; }
        .brand p { font-size: 11px; font-weight: 700; letter-spacing: .3em; color: rgba(125,211,252,.8); margin-top: 6px; text-transform: uppercase; }

        /* Plane drifting */
        .plane {
            position: absolute; top: 10%; left: -10%;
            width: 130px; opacity: .25; color: #cfe1ff;
            animation: fly 22s linear infinite;
        }
        @keyframes fly {
            0%   { transform: translate(0, 30px) rotate(-8deg); opacity: 0; }
            12%  { opacity: .28; }
            88%  { opacity: .28; }
            100% { transform: translate(120vw, -40px) rotate(-8deg); opacity: 0; }
        }

        /* Center content */
        .main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 10px 24px 40px; }

        .board {
            background: rgba(8,16,34,.66);
            border: 1.5px solid color-mix(in srgb, var(--accent) 45%, transparent);
            border-radius: 26px;
            padding: 40px 54px 46px;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 50px rgba(0,0,0,.45), 0 0 40px color-mix(in srgb, var(--accent) 18%, transparent);
            max-width: 760px;
        }
        .status-pill {
            display: inline-flex; align-items: center; gap: 9px;
            padding: 7px 16px; border-radius: 9999px;
            font-size: 12px; font-weight: 800; letter-spacing: .22em; text-transform: uppercase;
            background: color-mix(in srgb, var(--accent) 14%, transparent);
            border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
            color: var(--accent);
        }
        .status-pill .dot { width: 8px; height: 8px; border-radius: 9999px; background: var(--accent); box-shadow: 0 0 10px var(--accent); }

        .code {
            font-weight: 900; line-height: .9;
            font-size: clamp(96px, 22vw, 220px);
            color: var(--accent);
            letter-spacing: 4px;
            margin: 14px 0 6px;
            font-variant-numeric: tabular-nums;
            text-shadow: 0 0 26px color-mix(in srgb, var(--accent) 70%, transparent);
        }
        .title { font-size: clamp(22px, 3.4vw, 34px); font-weight: 900; letter-spacing: .04em; }
        .subtitle { margin-top: 8px; font-size: 13px; font-weight: 800; letter-spacing: .35em; text-transform: uppercase; color: rgba(125,211,252,.75); }
        .message { margin-top: 16px; font-size: 16px; line-height: 1.6; color: rgba(230,237,247,.7); max-width: 520px; margin-left: auto; margin-right: auto; }

        .actions { margin-top: 30px; display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .btn {
            display: inline-flex; align-items: center; gap: 9px;
            padding: 13px 26px; border-radius: 14px;
            font-weight: 800; font-size: 14px; letter-spacing: .04em; text-decoration: none;
            transition: transform .15s ease, box-shadow .15s ease;
        }
        .btn:hover { transform: translateY(-2px); }
        .btn-primary { background: var(--accent); color: #1a1206; box-shadow: 0 10px 30px color-mix(in srgb, var(--accent) 35%, transparent); }
        .btn-ghost { background: rgba(255,255,255,.06); color: #dbe7fb; border: 1px solid rgba(255,255,255,.14); }

        .ref { margin-top: 26px; font-size: 11px; letter-spacing: .2em; color: rgba(255,255,255,.28); text-transform: uppercase; }

        /* Batik bottom band */
        .batik {
            position: absolute; left: 0; right: 0; bottom: 0; height: 26px; z-index: 1;
            background: linear-gradient(90deg, #1a1206, #3a2a0a, #1a1206);
            border-top: 2px solid rgba(245,179,1,.55);
        }
        .batik::before {
            content: ""; position: absolute; inset: 0; opacity: .5;
            background-image:
                repeating-linear-gradient(45deg, rgba(245,179,1,.5) 0 8px, transparent 8px 16px),
                repeating-linear-gradient(-45deg, rgba(245,179,1,.25) 0 8px, transparent 8px 16px);
        }
        @media (max-width: 640px) {
            .brand { padding: 18px 20px; }
            .board { padding: 30px 24px 34px; border-radius: 20px; }
        }
    </style>
</head>
<body>
    <!-- Drifting plane -->
    <svg class="plane" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>

    <div class="wrap">
        <header class="brand">
            <span class="globe">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f5b301" stroke-width="1.8">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
            </span>
            <div>
                <h1>FIDS</h1>
                <p>APT Pranoto AAP Samarinda</p>
            </div>
        </header>

        <main class="main">
            <div class="board">
                <span class="status-pill"><span class="dot"></span>@yield('status', 'SYSTEM NOTICE')</span>
                <div class="code">@yield('code')</div>
                <div class="title">@yield('title')</div>
                <div class="subtitle">@yield('subtitle')</div>
                <p class="message">@yield('message')</p>

                <div class="actions">
                    <a href="/" class="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
                        Kembali ke Beranda
                    </a>
                    <a href="javascript:location.reload()" class="btn btn-ghost">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.8-3.4L23 10M1 14l4.7 4.4A9 9 0 0 0 20.5 15"/></svg>
                        Muat Ulang
                    </a>
                </div>

                <div class="ref">Flight Information Display System</div>
            </div>
        </main>
    </div>

    <div class="batik"></div>
</body>
</html>
