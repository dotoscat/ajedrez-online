import unittest
import chess
from chessasir import game

class TestMovesGeneration(unittest.TestCase):
    def setUp(self):
        self.board = chess.Board()

    def test1_pawn_moves(self):
        moves = game.get_pawn_moves(self.board, "white")
        self.assertTrue(
            isinstance(moves, dict))
        print(moves)

    def test2_pawn_promotion(self):
        board = chess.Board(fen='k7/ppppppPP/8/8/8/8/PPPPPPpp/K7 w KQkq - 0 10')
        moves = game.get_pawn_moves(board, "white")
        print(moves)
        self.assertTrue(moves['h7']['promotes'])
        self.assertFalse(moves['a2'].get('promotes'))
