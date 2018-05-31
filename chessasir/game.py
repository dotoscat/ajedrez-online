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

TEST_PROMOTION_FEN = '4q1q1/PPPPPPPP/8/k7/7K/8/pppp4/Q1Q5 w KQkq - 0 1'

async def send_player_quits(ws, color):
    message = {"command": "PLAYERQUITS", "color": color}
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

def get_piece_moves(board, color, piece):
    pieces = board.pieces(piece, color)
    moves = {}
    legal_moves = board.legal_moves
    for p in pieces:
        if piece is not chess.KING and board.is_pinned(color, p):
            continue
        name = chess.SQUARE_NAMES[p]
        piece_moves = {
            'moves': []
        }
        for attack in board.attacks(p):
            attack_name = chess.SQUARE_NAMES[attack]
            move = chess.Move.from_uci(name + attack_name)
            if move not in legal_moves:
                continue
            piece_moves['moves'].append(attack_name)
        if piece is chess.KING:
            if color is chess.WHITE and board.has_kingside_castling_rights(chess.WHITE):
                move = chess.Move.from_uci('e1g1')
                if move in legal_moves:
                    piece_moves['moves'].append('g1')
            if color is chess.WHITE and board.has_queenside_castling_rights(chess.WHITE):
                move = chess.Move.from_uci('e1c1')
                if move in legal_moves:
                    piece_moves['moves'].append('c1')
            if color is chess.BLACK and board.has_kingside_castling_rights(chess.BLACK):
                move = chess.Move.from_uci('e8g8')
                if move in legal_moves:
                    piece_moves['moves'].append('g8')
            if color is chess.BLACK and board.has_queenside_castling_rights(chess.BLACK):
                move = chess.Move.from_uci('e8c8')
                if move in legal_moves:
                    piece_moves['moves'].append('c8')
        moves[name] = piece_moves
    return moves

def get_pawn_moves(board, color):
    pawns = board.pieces(chess.PAWN, color)
    moves = {}
    legal_moves = board.legal_moves
    print("get pawn moves san", legal_moves)
    print("get pawn moves", color, list(legal_moves))
    step = 1 if color else -1
    for pawn in pawns:
        pawn_moves = {
            'moves': [],
        }
        if board.is_pinned(color, pawn):
            continue
        file = chess.FILE_NAMES[chess.square_file(pawn)]
        rank = chess.RANK_NAMES[chess.square_rank(pawn)]
        name = file + rank
        name1 = file + str(int(rank) + step)
        to1 = name + name1
        if (chess.Move.from_uci(to1) in legal_moves
        or chess.Move.from_uci(to1 + 'q') in legal_moves):
            pawn_moves['moves'].append(name1)
        if color and int(name1[1]) == 8:
            pawn_moves['promotes'] = True
        elif int(name1[1] == 1):
            pawn_moves['promotes'] = True
        try:
            name2 = file + str(int(rank) + step*2)
            to2 = name + name2
            two_step = chess.Move.from_uci(to2)
            if two_step in legal_moves:
                pawn_moves['moves'].append(name2)
        except ValueError:
            pass
        for attack in board.attacks(pawn):
            attack_name = chess.SQUARE_NAMES[attack]
            if (chess.Move.from_uci(name + attack_name) in legal_moves
            or chess.Move.from_uci(name + attack_name + 'q') in legal_moves):
                pawn_moves['moves'].append(attack_name)

        moves[name] = pawn_moves
    return moves

def get_moves(board, color):
    return dict(
        **get_pawn_moves(board, color),
        **get_piece_moves(board, color, chess.ROOK),
        **get_piece_moves(board, color, chess.KNIGHT),
        **get_piece_moves(board, color, chess.BISHOP),
        **get_piece_moves(board, color, chess.QUEEN),
        **get_piece_moves(board, color, chess.KING),
    )

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
        try:
            player = [p for p in self.players if p.ws is ws][0]
        except IndexError:
            return False
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
        # self.board.set_fen(TEST_PROMOTION_FEN)
        fen = self.board.fen()
        await send_start_game(self.white.ws, "WHITE", fen,
            get_moves(self.board, chess.WHITE))
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
            ws = self.white.ws if message['color'] == 'WHITE' else self.black.ws
            rival_ws = self.white.ws if message['color'] != 'WHITE' else self.black.ws
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
            await ws.send_json(okmove)
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
            await rival_ws.send_json(playermove)
        else:
            print("Move no ok")

