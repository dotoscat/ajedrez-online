# Juego multijugador en línea: ajedrez

## Introducción

El objetivo es hacer un juego de ajedrez en línea. Es un juego pausado, por turnos, haciendo fácil de sincronizar entre hosts.

Para el proyecto consta de dos host clientes conectados a un servidor, que puede estar alojado en una máquina remota para permitir partidas a través de Internet, o estar alojado en una máquina de una LAN.
![cliente-servidor](diagrama-cliente-servidor.png)

Solamente se requiere de un navegador web de parte del cliente para jugar en línea.
## Lado Cliente

El lado cliente es un navegador web donde corre una aplicación escrita en HTML5, JavaScript y CSS3. Se usa WebSockets para enviar y recibir datos con el servidor.

No se ha usado ningún framework de JavaScript. El motivo es que da más libertad a la hora de cómo organizar y escribir el código, además de ser más rápido de ejecutar.

### Archivos

+ index.html: El archivo principal. Es una plantilla de Jinja2 para poder pasar al cliente la dirección IP y el puerto del servidor.
+ chess.css: La hoja de estilos.
+ main.js: El archivo principal para instanciar las clases e iniciar la conexión con el servidor. Tiene que ir después de definirse **HOST** y **PORT** y va en el cuerpo de la página.
+ chess.js: Contiene las clases BoardViewer y Board.
+ widget.js: Contiene las clases para controlar el resto de los elementos de la interfaz como el diálogo de las promociones o el historial.
+ game.js: Contiene una clase para controlar toda la interfaz y atender los mensajes que llegan desde el servidor.
+ server.js: Contiene funciones para enviar mensajes al servidor.

### Clases

Cada elemento de la aplicación como el historial, el tablero o los mensajes... son clases que se instancian como objetos globales. Al ser instaciadas se les pasa el elemento, o los elementos, que tienen que manejar. Hay algunas clases que son de apoyo o no hay interacción directa.

Estas son las siguientes clases:

+ Messages: Controla los mensajes que irán apareciendo al usuario.
+ Historial: Este registra cada uno de los movimientos que se van haciendo durante la partida.
+ PieceCounter: Se encarga de llevar el registro de los movimientos hechos para cada uno de los jugadores durante sus turnos.
+ Promotion: Maneja la promoción de las piezas. Muestra un diálogo.
+ StartGame: Se encarga de empezar la partida como las BLANCAS.
+ RequestRestart: Este inicia el proceso para reempezar una partida como BLANCAS.
+ RequestDialog: Controla un diálogo de "Sí/No" cuando el cliente reciba la orden que el contrario quiere reiniciar la partida como las BLANCAS.
+ BoardViewer: Controla la entrada y la visualización de una instancia de Board. También controla un elemento canvas.
+ Board: Almacena y gestiona información acerca del estado del tablero.
+ Game: Tiene controles para sincronizar entre sí el resto de las instancias globales.

Un ejemplo de cómo instanciar estas clases

```javascript
// ...
const historial = new Historial(document.getElementById("historial"));
const board = new Board();
const boardViewer = new BoardViewer(document.getElementById("board"), board);
const promotion = new Promotion(document.getElementById("promotion"));
// ...
```

![1529054747424](1529054747424.png)

![1529055210806](1529055210806.png)

### Gestión de eventos en las clases

Elementos como un botón, una división o un canvas atiende a eventos como un click, un movimiento de ratón o si ha perdido el foco. También hay que gestionar la información que se maneje con esos eventos. Para atender a estos eventos se hace uso del método .addEventListener donde se pasa una función. *this* en una función que maneja el evento es el elemento que recibió la señal. Con .bind *this* ahora es la instancia de la clase siendo más cómodo de manipularla.

Ejemplo con la clase Promotion

```javascript
class Promotion {
    constructor(element, boardViewer){
        this.element = element;
        this.boardViewer = boardViewer;
        
	    document.getElementById("cancel")
            .addEventListener("click", this.cancel.bind(this));
        document.getElementById("p-queen")
            .addEventListener("click", this.promote.bind(this, "queen"));
        // ...
    }
    
    cancel(){
        this.boardViewer.restoreDraggedPiece();
        this.hide();
    }
    
	promote(piece){
        let pieceSet = Pieces.White;
        if (this.color === "BLACK")
            pieceSet = Pieces.Black;
        // ...  
		sendUCI(conn, this.from, this.to, this.lastPos, this.newPos, this.color, p);
         this.boardView.resetDrag();
         his.hide();
    }
}
```

### Constantes globales

* HOST: IP del servidor. Se define cuando se sirve la la aplicación web.
* PORT: Puerto del servidor. Se define cuando se sirve la aplicación web.
* conn: Conexión WebSocket.

**HOST** y **PORT** son necesarias para crear un websocket para comunicarse con el servidor. Para hacer esto la página web a servir es una plantilla Jinja2 con la siguiente parte:

```jinja2
<body>
    <!-- ... -->
    <script>
      const HOST = "{{ host }}";
      const PORT = "{{ port }}";
      // ...
    </script>
    <script src="main.js"></script>
</body>
<!-- ... -->
```
### Traducción de la notación algebraica del historial

![1529011859462](1529011859462.png)

Entre el cliente y el servidor hay mensajes que contiene una parte con la notación algebraica del movimiento realizado por un jugador durante su turno. En la información transmitida se pasa una letra en inglés indicando el tipo de pieza que participa en el movimiento. Para ser representado en el historial en español se traduce las letras usando una función. Se traducen de esta forma:

+ Q (Queen) -> D (Dama)
+ R (Rook) -> T (Torre)
+ N (kNight) -> C (Caballo)
+ B (Bishop) -> A (Alfil)
+ K (King) -> R (Rey)

Para la traducción se usa una tabla, un objeto, dentro de una función que lo realiza de la siguiente forma

```javascript
return san.replace(/[QKRBN]/g, match => trans[match]);
```

### Comunicación con el servidor

En el cliente se crea un websocket que conecta con el servidor de esta forma

````javascript
const conn = new WebSocket('ws://' + HOST + ':' + PORT + '/ws');
````

*/ws* es un punto en el servidor para atender conexiones con websockets. Después este socket se pasa a una instancia de Game para conectar con sus métodos con los eventos que ocurren durante la conexión.

Para comunicarse con el servidor los distintos controles usan las funciones definidas en *server.js*. Todas ellas aceptan como primer parámetro una conexión por websocket y no devuelven nada.

+ sendToServer(conn, command, data): Esta función es la que se encarga de enviar datos del servidor. El resto de funciones se basan en esta.

+ sendAcceptRestart(conn): Enviar al servidor que se ha aceptado la petición de reempezar la partida.

+ sendRejectRestart(conn): Enviar al servidor que es niega la petición de reempezar la partida.

+ sendRequestRestart(conn): Enviar al servidor una petición de reempezar la partida como BLANCAS.

+ sendUCI(conn, from, to, fromXY, toXY, color, promotion): Enviar al servidor el movimiento hecho, de qué turno (color) y la promoción si hay.

  ```javascript
  class RequestRestart {
      // ...
      sendRequestRestart(evt){
          sendRequestRestart(conn);
          this.hide();
          game.saveCurrentBoardViewBlock();
          // ...
      }
  }
  ```

  Hay algunas partes del código que usa sendToServer directamente. Por ejemplo, en la clase StartGame

  ```javascript
  class StartGame {
      constructor(element){
          this.element = element;
          element.addEventListener("click", this.doRequest.bind(this));
      }
      doRequest(evt){
          sendToServer(conn, "REQUESTWHITE");
      }
      //...
  }
  ```

### Clase Game y gestión de los mensajes del servidor

La clase Game recibe como parámetro en su constructor un websocket y luego conecta el evento "message" a .dispatchMessage() y "close" a una clausura dentro del constructor. Dentro de *dispatchMessage* se usa switch para el miembro **command** del mensaje.

```javascript
class Game{
	constructor(conn, boardViewer, messages){
    	this.conn = conn;
    	this.boardViewer = boardViewer;
    	this.messages = messages;
    	// ...

    	conn.addEventListener('message', this.dispatchMessage.bind(this));
    	conn.addEventListener('close', (close) => {
        	if (close.code === 1000 && close.wasClean){
                return;
            }
        const message = `Conexión perdida con el servidor, ${close.code}. Recarga la página.`;
            startGame.hide();
            this.messages.set = message;
            this.boardView.block = true;
        });
	}
    
    dispatchMessage(event){
		const message = JSON.parse(event.data);
        console.log("message", message);
        switch(message.command){
            case "STARTGAME":
                this.startGame(message);
            break;
            // ...
     }
    
        startGame(message){
            this.color = message.color;
            // ...
        }
        
}
```

### clase Board

Esta clase se encarga de gestionar la posición de las piezas en el tablero. Dispone de métodos para acceder a las piezas y manipularlas. Board hace uso de una estructura auxiliar, Tile, que guarda:

+ su nombre:  columna + rango
+ pieza: Si tiene alguna pieza
+ x: Posición que ocupa en las columnas
+ y: Posición que ocupa en las filas

Las instancias de Tile se guarda dentro del tablero de dos formas

+ En una matriz de dos dimnesiones
+ Mapa o mapa con su nombre como clave

Los métodos para manipular estas celdas son las siguientes:

+ setFromFEN(fen): Establecer el tablero según la información dada en formato FEN
+ hasPiece(x, y) -> Booleano: Mirar si alguna posición en particular tiene una pieza.
+ takePiece(x, y) -> Piece?: Toma una pieza del tablero y lo devuelve. La casilla queda vacía.
+ putPiece(x, y) -> Piece?: Pone una pieza en el tablero y devuelve la pieza que sustituye.
+ movePiece(from, to) -> Piece?: Mueve una pieza desde un punto a otro. Los puntos son objetos {x: número, y: número}. Devuelve la pieza que toma si hay alguna.
+ getTile(x, y) -> Tile?: Obtener una instancia de Tile a partir de la columna y la fila.
+ getTileByName(name) -> Tile?: Obtener una instancia de Tile a partir de su nombre.

### clase BoardViewer

Se encarga de controlar los eventos de ratón y usar los métodos de Board, así como de dibujar en pantalla los contenidos de este y las acciones que puede hacer. El elemento que se pasa a su constructor es un canvas y hay que atender a sus eventos **mousedown**, **mousemove**, **mouseup** y **mouseleave**.

Para obtener el índice de una celda hay que dividir el ancho y alto del tablero, no del canvas, entre las dimensiones de una celda, además de tener en cuenta el ancho del borde y el padding. Si se desea añadir funciones de arrastre (drag and drop) hay que hacer los cálculos teniendo en cuenta todo el ancho y alto del canvas.

```javascript
getMousePos(evt) {
    // drawarea es un elemento canvas, el usado para dibujar el tablero
	const rect = this.drawarea.getBoundingClientRect();
	const computedCSS = window.getComputedStyle(this.drawarea);
    // Se quita el sufijo 'px' del atributo precalculado y se convierte en un número.
	const borderLeftWidth = +computedCSS.borderLeftWidth.replace(/\D+/, '');
	const borderTopWidth = +computedCSS.borderTopWidth.replace(/\D+/, '');
	const paddingLeft = +computedCSS.paddingLeft.replace(/\D+/, '');
	const paddingTop = +computedCSS.paddingTop.replace(/\D+/, '');
    // ...
}
```

La posición del ratón obtenido por *evt.clientX* y *evt.clientY* tiene su origen desde la partida superior izquierda y corresponde al área de la pantalla de la aplicación. Para obtener su posición relativa dentro del elemento hay que restarlos con la posición top y left del canvas. *top* y *left* se obtienen con getBoundingClientRect(), que devuelve un objeto con las dimensiones del canvas.

```javascript
const rect = this.drawarea.getBoundingClientRect();
// ...
return {
    x: evt.clientX - rect.left - borderLeftWidth - paddingLeft,
    y: evt.clientY - rect.top - borderTopWidth - paddingTop
};
```

![1529146758998](1529146758998.png)

Aquí un ejemplo de lo que pasaría si se soltase el ratón mientras se arrastra una pieza:

Se pone la pieza arrastrada en el tablero y la pieza devuelta, o capturada, se añade al contador *addToCounterPiece*. Para indicar desde dónde hasta dónde se ha movido la pieza se almacena en *lastPos* y *newPos* para ser dibujado en el tablero luego. La pieza que se estaba arrastrando, *dragPiece*, se pone a nulo y los movimiento actuales de dicha pieza, *currentMoves*, se ponen a nulo también. Por último se envía el movimiento con *sendUCI* al servidor, que luego lo enviará al cliente rival.

```javascript
class BoardViewer {
    // ...
    onMouseUp(evt){
        const pos = this.getMousePos(evt);
        const tilePos = this.getTilePos(pos.x, pos.y);
        // ...
		const piece = this.board.putPiece(tilePos.x, tilePos.y, this.dragPiece);
        this.lastPos = this.dragOrigin;
        this.newPos = tilePos;
        this.addToCounterPiece(piece);
        this.dragPiece = null;
        this.currentMoves = null;
        sendUCI(conn, lastTile.name,
                currentTile.name,
                this.lastPos, this.newPos,
                this.assignedColor);
        // ...
        this.dragOrigin = null;
        this.draw();
    }
}
```

### Dibujado

Por cada cambio en *board* o eventos como como pulsar o arrastrar una ficha se tiene que actualizar la visualización de *BoardViewer*. Se tiene que hacer por pasos para evitar, por ejemplo, que se dibuje una pieza antes que el fondo del tablero haciéndolo invisible.

Todos estos pasos se pueden englobar dentro de un método *draw* para *BoardViewer*, y todas las operaciones se realizan con el contexto del canvas:

+ Limpiar el canvas.
+ Dibujar fondo del tablero.
+ Dibujar las coordenadas del tablero.
+ Dibujar la última y nueva posición de la última pieza movida, si hay.
+ Dibujar todas las piezas del tablero, en *board*.
+ Dibujar los movimiento legales de una pieza seleccionada, si hay.

```javascript
// ...
draw() {
	this.drawarea.getContext('2d')
        .clearRect(0, 0, this.drawarea.width, this.drawarea.height);
     this.drawBackground();
     this.drawCoordinates();
     // ...
}

drawBackground() {
    // Dibujar el fondo de tablero de ajedrez.
    const ctx = this.drawarea.getContext("2d");
    const colors = ["white", "grey"];
    const tileSize = this.tileSize;
    ctx.save();
    for (let y = 0; y < 8; y += 1){
        for (let x = 0; x < 8; x += 1){
            const color = colors[0];
            ctx.fillStyle = color;
            ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
            colors.reverse();
        }
        colors.reverse();
    }
    ctx.restore();
}
// ...
```

Para poder dibujar las coordenadas, el área del canvas tiene que ser ligeramente mayor como para poder dibujar los símbolos de los rangos y las columnas. Un buen valor para comenzar es usar el tamaño de la fuente para dibujar las letras de las coordenadas.

![1529164041239](1529164041239.png)

### Perspectiva de las negras

![1529230584288](D:\proyectos\ajedrez-asir\documentacion\1529230584288.png)

Para adaptar la interfaz a la perspectiva de las negras el BoardViewer puede tener una propiedad para indicar que la perspectiva de las negras, por ejemplo *blackView*. Cuando está activado entonces se adapta para obtener un *Tile* del *board* y el dibujado.

```javascript
// x e y son coordenadas del ratón ya transformadas
getTilePos(x, y) {
    if (this.blackView){
        // se invierte según el ancho y alto del tablero
        return {
            x: 7 - parseInt(x/this.tileSize),
            y: 7 - parseInt(y/this.tileSize),
        };
    }
    return {
        x: parseInt(x/this.tileSize),
        y: parseInt(y/this.tileSize),
    };
}
```

Para poder dibujar se tiene que invertir la posición final de lo que se quiera dibujar tomando en cuenta que el origen del canvas es arriba e izquierda. Aquí un ejemplo para dibujar las piezas.

```javascript
drawPieces() {
    const tileSize = this.tileSize;
    const ctx = this.drawarea.getContext("2d");
    const boardTiles = this.board.tiles;
    for (let y = 0; y < 8; y += 1){
        for(let x = 0; x < 8; x += 1){
            const tile = boardTiles[y][x];
            if (tile.piece === null)
                continue;
            if (this.blackView){
                ctx.fillText(tile.piece.text,
                            this.boardWidth - x*tileSize - tileSize,
                            y*tileSize - tileSize/8. + tileSize);
            }else{
                ctx.fillText(tile.piece.text,
                            x*tileSize,
                            this.boardHeight - y*tileSize - tileSize/8.);
            }
        }
    }
}
```

## Lado Servidor

El lado servidor es un servidor web escrito en Python3. La versión 3.5 o superior es necesario para hacer correr el servidor porque hace uso de las nuevas palabras claves **async** y **await** para la programación asíncrona con *aiohttp*. Se ha elegido Python porque es fácil de usar y de aprender.

### Estructura del servidor

+ chess_server.py: Punto de entrada para arrancar el servidor.
+ chessasir: Paquete de Python, una carpeta, donde están las clases y utilidades para ser usadas por el servidor web.
  + game.py: Contiene la clase Game para manejar la partidas entre los clientes y atender los websockets.
  + moves.py: Contiene funciones de apoyo para calcular la lista de movimientos válidos para cada una de las piezas de un jugador en concreto.
  + player.py: Es una clase auxiliar usada por Game para guardar el websocket del cliente y su color (BLANCAS o NEGRAS).
+ chess-client: Carpeta donde está alojado la aplicación web para servir al cliente.

### Módulos o paquetes usados

+ [aiohttp](https://aiohttp.readthedocs.io/en/stable/): servidor y cliente http asíncrono para [asyncio](https://docs.python.org/3.5/library/asyncio.html) y Python. Soporta websockets para el servidor y el cliente.

+ [aiohttp-jinja2](http://aiohttp-jinja2.readthedocs.io/en/stable/): Soporte de plantillas de [Jinja2](http://jinja.pocoo.org/) para aiohttp.

+ [python-chess](https://python-chess.readthedocs.io/en/stable/): Genera movimientos y valida los movimientos recibidos de un jugador.

+ chessasir: Paquete propio del proyecto de ayuda.

### Arranque del servidor

Al ejecutar chess_server por defecto toma la dirección de la última interfaz disponible y el puerto por defecto es 1337.

Para dar una dirección válida al servidor de forma automática se utiliza el siguiente código en Python

```python
import socket

ip_list = socket.gethostbyname_ex(socket.gethostname())[2]
ip = ip_list.pop()
```

Se puede cambiar la dirección y el puerto en el momento de ejecutar el servidor.

```shell
./chess_server -i 127.0.0.1 -p 30000
```

Para dar soporte a la interfaz de línea de comandos con parámetros por defecto se usa [argparse](https://docs.python.org/3.5/library/argparse.html#module-argparse) que es un módulo de la biblioteca estándard de Python.

```python
ip_list = socket.gethostbyname_ex(socket.gethostname())[2]

parse = argparse.ArgumentParser()
parse.add_argument("--ip", "-i", default=ip_list.pop(), help="ipv4")
parse.add_argument("--port", "-p", default=1337)
args = parse.parse_args()
# ...
```

### Programación asíncrona

Enviar y recibir datos de internet y leer y escribir datos en los archivos implica operaciones de entrada y salida que normalmente bloquean el flujo de un programa que espera a que se completen. Ese tiempo se puede emplear para otras tareas, incluso hacer mas operaciones de entrada y salida, cosa que se logra con la programación asíncrona. En un servidor web esto significa atender mas peticiones en menos tiempo.

En Python para atender peticiones web de forma asíncrona se hace con las palabras claves **async**, **await** y el módulo **aiohttp**.

### Servir la aplicación web

Para servir la aplicación web y pueda comunicarse con el servidor se hace uso del módulo *aiohttp-jinja2* para poder pasar la dirección ip del servidor y el puerto. Con poner la dirección del sitio ya se sirve la aplicación web.

```python
from aiohttp import web
import aiohttp_jinja2
import jinja2

app = web.Application()
aiohttp_jinja2.setup(app,
                     loader=jinja2.FileSystemLoader('chess-client'))

async def index(request):
    response = aiohttp_jinja2.render_template(
        'index.html',
        request, 
        {"host": args.ip, "port": args.port})
    return response

app.router.add_get("/", index)
# ...
```

Así al escribir solamente la dirección asignada del servidor en el navegador, por ejemplo 192.168.1.7, ya se mostraría.

### Websockets

Para que el cliente pueda comunicarse mediante websockets con el servidor, este tiene que habilitar un punto donde ofrezca el servicio. Los websockets se atienden con el uso del bucle **async for** dentro der su manejador, esto permite atender atender otras peticiones web.

Desde la aplicación web se conecta al servidor desde la ruta *'/ws'*.

```python
from chessasir.game import Game
# ...
app['game'] = Game()
# ...
async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
	# ...
    game = request.app['game']
    async for msg in ws:
    	if msg.type == aiohttp.WSMsgType.TEXT:
        if msg.data == 'close':
        	await ws.close()
        else:
           	await game.dispatch_message(msg.json(), ws)
            await ws.send_json({'command': 'DATA', 'data': msg.data})
        elif msg.type == aiohttp.WSMsgType.ERROR:
            print('ws connection clossed with exception {}'.format(ws.exception()))
    # ...
    return

# ...
app.router.add_get("/", index)
app.router.add_get("/ws", websocket_handler)
# ...
```

### Websockets vs REST

El motivo por el que se ha elegido websockets sobre una API REST es porque se transmite un estado de forma bidireccional entre el cliente y el servidor mientras que en una API REST es bastante complicado de menajear estado, además de que el cliente siempre tiene que empezar a enviar una petición para poder recibir una respuesta por parte del servidor.

## Game



Para controlar las partidas de ajedrez hace uso del módulo *python-chess* que valida los movimientos enviados desde los clientes, y puede generar listas de movimientos legales de cada una de las piezas de un jugador.

## Protocolos y la red

### Red

El modelo de red escogido es del **cliente-servidor**. Es más directo de implementar que un modelo par-a-par, separa claramente la funcionalidades de cada lado haciéndolo más fácil de mantener y hace más difícil de hacer trampas porque el servidor es autoritativo. En contra, es más costoso de desplegar y si el servidor cae el resto de los clientes conectados al servidor también caen.

Tanto el cliente como el servidor hace uso de websockets. Los websockets son un canal de comunicación bidireccional y full-duplex que permite ser usado en navegadores web y servidores que lo soporten para comunicarse entre sí con TCP. Los clientes nunca se comunican entre sí, solo a través del servidor.

### Protocolo

El formato del protocolo es JSON, basado en texto. JSON es fácil de manejar en el lado cliente que usa JavaScript y en el lado del servidor con Python y aiohttp. JSON se transmite codificado en UTF-8, que por defecto es lo que los navegadores web y los servidores usan.

Todos los mensajes que se transmiten tienen el miembro **command** que almacena como cadena en mayúsculas el comando que se quiere realizar. Dependiendo el comando habrá miembros adicionales.

Ejemplos de mensajes:

```json
{"command": "STARTGAME", "color": "WHITE"}
{"command": "ACCEPTRESTART"}
{"command": "SENDMOVE", "color": "BLACK", "to": "b3", "from": "b2", "fromXY": {"x": 1, "y": 1}, "toXY": {"x": 1, "y": 2}}
```

El protocolo usa algunos términos que son estos

+ **fen**: Es una notación estándard para describir una posición particular de una partida de ajedrez. Da la información necesaria para reempezar una partida de ajedrez desde un momento en particular.
+ **san**: Es una notación para registrar y describir movimientos en una partida de ajedrez.
+ **ep:** Es un movimiento de ajedrez que puede hacerse justo después de que un peón adelanta dos casillas y se sitúa al lado de un peón rival. Este peón rival puede entonces capturar al peón como si hubiese adelantado solo una casilla sólo en su próximo turno.

| Comando        | Parámetros                                                   | Destinatario                   | Información                                                  |
| -------------- | ------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------ |
| PLAYERJOINED   |                                                              | Servidor -> Cliente            | Indica a otro cliente que un jugador se ha unido a la partida. |
| PLAYERQUITS    |                                                              | Servidor -> Cliente            | Indica a otro cliente que un jugador se ha quitado de la partida. |
| REQUESTWHITE   |                                                              | Cliente -> Servidor            | Un jugador solicita empezar la partida como las BLANCAS.     |
| STARTGAME      | **color**: ("WHITE" \| "BLACK")                              | Servidor -> Clientes           | El servidor indica que ha empezado la partida y envía el color asignado a los clientes. |
| SENDMOVE       | **from**: coordenadas , **to**: coordenadas, **color**: ("WHITE" \| "BLACK"), **fromXY**: {x: columna del tablero, y: fila del tablero}, **toXY**: {x: columna del tablero, y: fila del tablero} | Cliente -> Servidor            | Un jugador envía un movimiento al servidor.                  |
| OKMOVE         | **color**: ("WHITE" \| "BLACK"), **san**: san, **fen**: fen, **turn**: turno actual, **ep**: si está al paso (true, false), **result**: Si el juego acaba, indicar el resultado para **color**, **reason**: Razón del resultado (jaque mate, ahogamiento...). | Servidor -> Cliente            | Indica al cliente que envió SENDMOVE que el movimiento está bien con el nuevo estado del tablero indicado en **fen**. |
| PLAYERMOVE     | **color**: ("WHITE" \| "BLACK"), **san**: san, **fen**: fen, **turn**: turno actual, **from**: {x: columna del tablero, y: fila del tablero}, **to**: {x: columna del tablero, y: fila del tablero}, **ep**: si está al paso (true, false), **moves**: lista de movimiento legales para cada una de las piezas del otro jugador, **result**: Si el juego acaba, indicar el resultado para **color**, **reason**: Razón del resultado (jaque mate, ahogamiento...). | Servidor -> Cliente            | Indica al otro cliente del que envió SENDMOVE que el rival ha hecho un movimiento y le toca su turno. |
| REQUESTRESTART |                                                              | Cliente -> Servidor -> Cliente | El jugador solicita reempezar la partida como las blancas al otro jugador. |
| REJECTRESTART  |                                                              | Cliente -> Servidor -> Cliente | El jugador indica al otro jugador que rechaza reempazar la partida como blancas. |
| ACCEPTRESTART  |                                                              | Cliente -> Servidor            | El jugador acepta dejar reempezar la partida siendo su rival las blancas. |



## Aspectos de presentación

### Servidor

El servidor usa una interfaz para linea de comandos. Se configura con parámetros desde una terminal.

### Cliente

El cliente al ser un navegador web usa una hoja de estilos proporcionado desde el servidor. El tablero de ajedrez se dibuja usando la etiqueta **canvas** y JavaScript. En el proyecto el tablero está encapsulado en una clase *BoardViewer* que maneja un elemento **canvas**.![1528821290362](1528821290362.png)

## Problemática

## Conclusiones

Para aprender a hacer juegos en línea, juegos de ritmo lento como el ajedrez o el tres en raya es una buena forma de empezar. Se aprende a diseñar e interpretar un protocolo. Además no tienes muchos problemas de sincronización entre el servidor y los clientes.

Una aplicación web permite el juego en línea en cualquier medio con un navegador web con soporte a JavaScript, WebSockets y el elemento *canvas*.

## Mejoras

+ Poder entrar en una sala bajo un nick y crear una partida.
+ Hacer correr el servidor web a través Apache o Nginx, ya que no es seguro servir los contenidos estáticos (js, html, css) a través de la aplicación web.
+ Guardar y restaurar partidas. Ya esto requiere registro de usuarios.
+ Ofrecer una versión adaptada a los móviles. Ahora mismo está diseñado sólo para el escritorio.
+ Una IA al lado del servidor para partidas remotas contra la máquina. El servidor web tendría que comunicarse con un motor de ajedrez como GNU Chess y enviar los resultados de vuelta al cliente.
+ Hacer que se ajuste mejor en escritorios mas pequeños.