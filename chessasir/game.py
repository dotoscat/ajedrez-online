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
# along with this program.  If not, see <https:#www.gnu.org/licenses/>.import signal

import random
import chess
from .player import Player

async def send_player_quits(ws, color):
    message = {"command": "PLAYERQUITS", "color": color}
    await ws.send_json(message)

async def send_start_game(ws, color, fen):
    message = {
        "command": "STARTGAME",
        "color": color,
        "fen": fen}
    await ws.send_json(message)

class Game:
    def __init__(self):
        self.board = chess.Board()
        self.players = []

    @property
    def unpaired(self):
        return len(self.players) != 2

    def add_player(self, ws):
        if not self.unpaired:
            return False
        player = Player(ws)
        self.players.append(player) 
        return True

    async def remove_player(self, ws):
        if not self.players:
            return False
        player = [p for p in self.players if p.ws is ws][0]
        self.players.remove(player)
        if self.white == player:
            self.white = None
        else:
            self.black = None
        if self.players:
            await send_player_quits(self.players[0].ws, player.color)
        return True

    async def start(self):
        if self.unpaired:
            return False
        random_players = list(self.players)
        random.shuffle(random_players)
        self.white = random_players.pop()
        self.white.color = "WHITE"
        self.black = random_players.pop()
        self.black.color = "BLACK"
        self.board.reset()
        fen = self.board.fen()
        await send_start_game(self.white.ws, "WHITE", fen)
        await send_start_game(self.black.ws, "BLACK", fen)
        return True

    async def dispatch_message(self, message):
        print("message", message)
        command = message['command']
        if command == 'SENDMOVE':
            await self.send_move(message)

    async def send_move(self, message):
        turn = message['color'] == 'WHITE'
        if turn == self.board.turn:
            move = chess.Move.from_uci(message['from'] + message['to'])
            san = self.board.san(move)
            self.board.push(move)
            ws = self.white.ws if message['color'] == 'WHITE' else self.black.ws
            rival_ws = self.white.ws if message['color'] != 'WHITE' else self.black.ws
            okmove = {
                "command": "OKMOVE",
                "color": message['color'],
                "san": san,
                "turn": self.board.fullmove_number
                }
            await ws.send_json(okmove)
            playermove = {
                "command": "PLAYERMOVE",
                "color": message['color'],
                "san": san,
                "turn": self.board.fullmove_number,
                "from": message['fromXY'],
                "to": message['toXY']
                }
            await rival_ws.send_json(playermove)
        else:
            print("Move no ok")

