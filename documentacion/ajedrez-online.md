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

Entre el cliente y el servidor hay mensajes que contiene una parte con la notación algebraica del movimiento realizado por un jugador durante su turno. En la información transmitida se pasa una letra en inglés indicando el tipo de pieza que participa en el movimiento. Para ser representado en historial en español se traduce las letras usando una función. Se traducen de esta forma:

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

La clase Game recibe como parámetro en su constructor un websocket y luego conecta el evento "message" a .dispatchMessage() y "close" a una clausura dentro del constructor. Dentro del dispatch se usa switch para el miembro **command** del mensaje.

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
+ getTile(x, y) -> Tile: Obtener una instancia de Tile a partir de la columna y la fila.
+ getTileByName(name) -> Tile: Obtener una instancia de Tile a partir de su nombre.

### clase BoardViewer

## Lado Servidor

El lado servidor es un servidor web escrito en Python3. La versión de Python3.5 o superior es necesario para hacer correr el servidor. Hace uso de las nuevas palabras claves **async** y **await** para la programación asíncrona con *asyncio*, un módulo de biblioteca estándard de Python que permite la programación asíncrona.

Python es un lenguaje fácil de usar pero no está pensado para la programación asíncrona que involucra operaciones de entrada y salida. Para servir aplicaciones web de forma asíncrona hace uso de *aiohttp*, construida por encima de *asyncio* y además ofrece soporte para gestionar conexiones de websockets sin necesidad de retrollamadas (callbacks) como pasa con nodejs.

La página web está escrita como una plantilla de Jinja2, así que el módulo *aiohttp-jinja2* también es usado para dar soporte a la plantillas jinja2 con *aiohttp*.

Para controlar las partidas de ajedrez hace uso del módulo *python-chess* que valida los movimientos enviados desde los clientes, y puede generar listas de movimientos legales de cada una de las piezas de un jugador.

La aplicación consiste en un script de entrada y un paquete específico para el servidor web llamado *chessasir*. Desde el script de entrada se sirve a los cliente el contenido de *chess-client*.

La dirección IP y el puerto del servidor se puede configurar desde la línea de comandos. Por defecto la IP del servidor se adopta desde la última interfaz de red detectada que no sea localhost.

## Protocolos y la red

### Red

El modelo de red escogido es del **cliente-servidor**. Es más directo de implementar que un modelo par-a-par, separa claramente la funcionalidades de cada lado haciéndolo más fácil de mantener y hace más difícil de hacer trampas porque el servidor es autoritativo. En contra, es más costoso de desplegar y si el servidor cae el resto de los clientes conectados al servidor también caen.

Tanto el cliente como el servidor hace uso de websockets. Los websockets son un canal de comunicación bidireccional y full-duplex que permite ser usado en navegadores web y servidores que lo soporten para comunicarse entre sí con TCP. Los clientes nunca se comunican entre sí, solo a través del servidor.

### Protocolo

El formato del protocolo es JSON, basado en texto. JSON es fácil de manejar en el lado cliente que usa JavaScript y en el lado del servidor con Python y aiohttp. JSON se transmite codificado en UTF-8, que por defecto es lo que los navegadores web y los servidores usan.

Todos los mensajes que se transmiten tienen el miembro **command** que almacena como cadena en mayúsculas el comando que se quiere realizar. Dependiendo el comando habrá miembros adicionales.

Ejemplos:

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

Una aplicación web permite el juego en línea en cualquier medio con un navegador web con soporte a JavaScript, WebSockets y el elemento **canvas**.

## Mejoras

+ Poder entrar en una sala bajo un nick y crear una partida.
+ Hacer correr el servidor web a través Apache o Nginx, ya que no es seguro servir los contenidos estáticos (js, html, css) a través de la aplicación web.
+ Guardar y restaurar partidas. Ya esto requiere registro de usuarios.
+ Ofrecer una versión adaptada a los móviles. Ahora mismo está diseñado pensado para el escritorio.
+ Una IA al lado del servidor para partidas remotas contra la máquina. El servidor web tendría que comunicarse con un motor de ajedrez como GNU Chess y enviar los resultados de vuelta al cliente.
+ Hacer que se ajuste mejor en escritorios mas pequeños.