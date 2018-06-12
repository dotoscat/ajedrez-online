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
# along with this program.  If not, see <https:#www.gnu.org/licenses/>.

import chess
from .player import Player
from .moves import get_moves

TEST_PROMOTION_FEN = '4q1q1/PPPPPPPP/8/k7/7K/8/pppp4/Q1Q5 w KQkq - 0 1'

async def send_player_quits(ws):
    message = {"command": "PLAYERQUITS"}
    await ws.send_json(message)

async def send_start_game(ws, color, fen, moves=None):
    message = {
        "command": "STARTGAME",
        "color": color,
        "fen": fen
    }
    print("start game fen", fen)
    if moves:
        message["moves"] = moves
    await ws.send_json(message)

class Game:
    def __init__(self):
        self.board = chess.Board()
        self.players = []
        self.white = None
        self.black = None
        self._request_restart = None

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
        try:
            player = [p for p in self.players if p.ws is ws][0]
        except IndexError:
            return False
        self.players.remove(player)
        self.white = None
        self.black = None
        if self.players:
            await send_player_quits(self.players[0].ws)
        return True

    async def send_joined(self):
        message = {'command': 'PLAYERJOINED'}
        await self.players[0].ws.send_json(message)
        await self.players[1].ws.send_json(message)

    async def request_white(self, player_ws):
        if self.unpaired:
            print("request unpaired")
            return False
        if self.white and not [p for p in self.players if p.ws is player_ws]:
            print("request white from another connection")
            return False
        try:
            player = [p for p in self.players if p.ws is player_ws][0]
        except IndexError:
            print("request player not found")
            return False
        self.white = player
        self.white.color = "WHITE"
        self.black = [p for p in self.players if p.ws is not player_ws][0]
        self.black.color = "BLACK"
        return await self.start()

    async def start(self):
        if self.unpaired:
            return False
        self.board.reset()
        # self.board.set_fen(TEST_PROMOTION_FEN)
        fen = self.board.fen()
        await send_start_game(self.white.ws, "WHITE", fen,
            get_moves(self.board, chess.WHITE))
        await send_start_game(self.black.ws, "BLACK", fen)
        return True

    async def dispatch_message(self, message, ws):
        print("message", message)
        command = message['command']
        if command == 'SENDMOVE':
            await self.send_move(message)
        elif command == 'REQUESTWHITE':
            await self.request_white(ws)
        elif command == 'REQUESTRESTART':
            await self.request_restart(ws)
        elif command == 'REJECTRESTART':
            await self.reject_restart(ws)
        elif command == 'ACCEPTRESTART':
            await self.accept_restart()

    async def accept_restart(self):
        self.white = None
        self.black = None
        await self.request_white(self._request_restart)
        self._request_restart = None

    async def reject_restart(self, ws):
        print("_request_restart", not self._request_restart, self._request_restart)
        if self._request_restart is None:
            return
        await self._request_restart.send_json({'command': 'REJECTRESTART'})
        self._request_restart = None

    async def request_restart(self, ws):
        if self._request_restart:
            await ws.send_json({'command': 'REJECTRESTART'})
            return
        try:
            rival = [p for p in self.players if ws is not p.ws][0]
        except IndexError:
            await ws.send_json({'command': 'REJECTRESTART'})
            return
        await rival.ws.send_json({'command': 'REQUESTRESTART'})
        self._request_restart = ws

    async def send_move(self, message):
        turn = message['color'] == 'WHITE'
        if turn == self.board.turn:
            promotion = message.get('promotion')
            if promotion:
                move = chess.Move.from_uci(message['from'] + message['to'] + promotion)
            else:
                move = chess.Move.from_uci(message['from'] + message['to'])
            en_passant = self.board.is_en_passant(move)
            castling = self.board.is_castling(move)
            print("ep", en_passant)
            san = self.board.san(move)
            self.board.push(move)
            player = self.white if message['color'] == 'WHITE' else self.black
            rival = self.white if message['color'] != 'WHITE' else self.black
            okmove = {
                "command": "OKMOVE",
                "color": message['color'],
                "san": san,
                "turn": self.board.fullmove_number
                }
            if en_passant:
                okmove['ep'] = True
                okmove['fen'] = self.board.fen()
            if castling or promotion:
                okmove['fen'] = self.board.fen()
            self.check_endofgame(okmove, player.color)
            await player.ws.send_json(okmove)
            moves = get_moves(self.board, self.board.turn)
            playermove = {
                "command": "PLAYERMOVE",
                "color": message['color'],
                "san": san,
                "turn": self.board.fullmove_number,
                "from": message['fromXY'],
                "to": message['toXY'],
                "moves": moves
                }
            if en_passant:
                playermove['ep'] = True
                playermove['fen'] = self.board.fen()
            if castling or promotion:
                playermove['fen'] = self.board.fen()
            self.check_endofgame(playermove, rival.color)
            await rival.ws.send_json(playermove)
        else:
            print("Move no ok")

    def check_endofgame(self, message, color):
        if not self.board.is_game_over():
            return
        white_result, black_result = self.board.result().split('-')
        if color == "WHITE":
            message["result"] = white_result
        elif color == "BLACK":
            message["result"] = black_result
        if self.board.is_checkmate():
            message["reason"] = "checkmate"
        elif self.board.is_stalemate():
            message["reason"] = "stalemate"
        elif self.board.is_insufficient_material():
            message["reason"] = "material"