from cx_Freeze import setup, Executable

# Dependencies are automatically detected, but it might need
# fine tuning.
buildOptions = dict(
    packages = ['asyncio', 'idna'],
    excludes = ['tkinter'],
    include_files = ['chess-client'])

base = 'Console'

executables = [
    Executable('chess_server.py', base=base)
]

setup(name='chess-online-asir',
      version = '1.0',
      description = 'Un ajedrez en linea',
      options = dict(build_exe = buildOptions),
      executables = executables)
