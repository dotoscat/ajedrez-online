from setuptools import setup, find_packages

setup(
    name="ajedrez-asir",
    version="0.1",
    packages=find_packages(),
    install_requires=['aiohttp', 'aiohttp-jinja2', 'python-chess'],
    package_data={
        'chessasir': ['chess-client/*.*'],
    },
    entry_points={
        'console_scripts': [
            'ajedrezasirserver = chessasir.server:main'
        ]
    },
    author="Oscar (dotoscat) Triano",
    description="ajedrez online para ASIR",
    url="https://github.com/dotoscat/ajedrez-online",
    license="AGPL-3.0",
    # selectors=[
    #     "Development Status :: 5 - Production/Stable",
    #     "Framework :: Flask",
    #     "Framework :: Pelican",
    #     "Intended Audience :: Developers",
    #     "License :: OSI Approved :: GNU Affero General Public License v3 or later (AGPLv3+)",
    #     "Programming Language :: JavaScript",
    #     "Programming Language :: Python :: 3 :: Only",
    #     "Topic :: Desktop Environment",
    # ],
)
