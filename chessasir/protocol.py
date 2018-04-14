import struct

STARTGAME = 1

startgame = struct.Struct("!Bb")

def get_command(data):
    return data[:1]
