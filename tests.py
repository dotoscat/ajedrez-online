import unittest
import chess
from chessasir import game

class TestMovesGeneration(unittest.TestCase):
    def setUp(self):
        self.board = chess.Board()

    def test1_pawn_moves(self):
        moves = game.get_pawn_moves(self.board, chess.WHITE)
        self.assertTrue(
            isinstance(moves, dict))
        print(moves)

    def test2_pawn_promotion(self):
        board = chess.Board(fen='k7/ppppppPP/8/8/8/8/PPPPPPpp/K7 w KQkq - 0 10')
        moves = game.get_pawn_moves(board, chess.WHITE)
        print(moves)
        self.assertTrue(moves['h7']['promotes'])
        self.assertFalse(moves['a2'].get('promotes'))

    def test3_pawn_pinned(self):
        board = chess.Board(fen='4q3/8/8/8/8/8/3PP3/4K3 w KQkq - 0 1')
        moves = game.get_pawn_moves(board, chess.WHITE)
        print(moves)
        self.assertFalse(moves.get("e3"))

    def test4_piece_movement(self):
        board = chess.Board(fen='8/8/8/3q2r1/8/8/8/3K4 b KQkq - 0 1')
        rook_moves = game.get_piece_moves(board, chess.BLACK, chess.ROOK)
        queen_moves = game.get_piece_moves(board, chess.BLACK, chess.QUEEN)
        self.assertTrue(rook_moves)
        self.assertTrue(queen_moves)
