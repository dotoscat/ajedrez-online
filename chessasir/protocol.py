import struct

STARTGAME = 1
REJECTED = 2
MOVE = 3

command = struct.Struct("!B")
startgame = struct.Struct("!BB")
move = struct.Struct("!B8s")

def get_command(buffer):
    return command.unpack_from(buffer)[0]
