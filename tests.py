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
