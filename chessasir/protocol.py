import struct

STARTGAME = 1
REJECTED = 2

command = struct.Struct("!B")
startgame = struct.Struct("!BB")

def get_command(buffer):
    return command.unpack_from(buffer)[0]
