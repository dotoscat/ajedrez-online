# Copyright (C) 2018  Oscar 'dotoscat' Garcia

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see <https:#www.gnu.org/licenses/>.

import socket
import signal
import argparse
import logging
import os.path
import aiohttp
from aiohttp import web
import aiohttp_jinja2
import jinja2
from .game import Game

logging.basicConfig(format="%(pathname)s:%(module)s:%(levelname)s:%(message)s", level=logging.DEBUG)
signal.signal(signal.SIGINT, signal.SIG_DFL)

def main():
    ip_list = socket.gethostbyname_ex(socket.gethostname())[2]

    parse = argparse.ArgumentParser()
    parse.add_argument("--ip", "-i", default=ip_list.pop(), help="ipv4")
    parse.add_argument("--port", "-p", default=1337)
    args = parse.parse_args()
    logging.info("Listen from {}:{}".format(args.ip, args.port))
    app = web.Application()
    resources_dir = os.path.join(os.path.dirname(__file__), "chess-client")
    aiohttp_jinja2.setup(app,
        loader=jinja2.FileSystemLoader(resources_dir))

    async def index(request):
        response = aiohttp_jinja2.render_template(
            'index.html',
            request, 
            {"host": args.ip, "port": args.port})
        return response
   
    async def websocket_handler(request):
        peer = request.transport.get_extra_info("peername")
        print("request peer", peer)
        ws = web.WebSocketResponse(heartbeat=1., receive_timeout=3.)
        await ws.prepare(request)

        game = request.app['game']
        game.add_player(ws)

        if not game.unpaired:
            await game.send_joined()
            print("Send PLAYERJOINED message!")

        async for msg in ws:
            print("ws: ", msg.data, "; closed:", ws.closed)
            if msg.type == aiohttp.WSMsgType.TEXT:
                if msg.data == 'close':
                    await ws.close()
                else:
                    await game.dispatch_message(msg.json(), ws)
                    await ws.send_json({'command': 'DATA', 'data': msg.data})
            elif msg.type == aiohttp.WSMsgType.ERROR:
                print('ws connection clossed with exception {}'.format(ws.exception()))
            elif msg.type == aiohttp.WSMsgType.CLOSE:
                print(peer, "close")
            elif msg.type == aiohttp.WSMsgType.CLOSED:
                print(peer, "closed")

        print('websocket connection closed')

        await game.remove_player(ws)

        return ws

    app['game'] = Game()

    app.router.add_get("/", index)
    app.router.add_get("/ws", websocket_handler)
    print(__name__, __file__, __package__, resources_dir)
    app.router.add_static("/", resources_dir)
    web.run_app(app, host=args.ip, port=args.port)
    # server = Server(args.ip, args.port)
    # server.run()

if __name__ == "__main__":
    main()
