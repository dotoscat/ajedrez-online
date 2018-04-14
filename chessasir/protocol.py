import struct

STARTGAME = 1
REJECTED = 2
MOVE = 3

command = struct.Struct("!B")
startgame = struct.Struct("!BB") # command, assigned color
move = struct.Struct("!BB8s") # command, color, uci

def get_command(buffer):
    return command.unpack_from(buffer)[0]
