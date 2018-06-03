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
