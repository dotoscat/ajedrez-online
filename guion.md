## Explicar qué he hecho

+ Un ajedrez en línea
+ Soporta hasta 2 jugadores
+ Es un servidor que ofrece una aplicación web.
+ El servidor está escrito con Python, aiohttp y python-chess.
+ La aplicación web está hecha con JavaScript sin ningún framework.

## Cómo inicializar el servidor

+ Hablar de las opciones por defecto (se autoconfigura con una ip).
+ Explicar las opciones de inicialización.

### Enseñar la aplicación web

+ Decir que un navegador web al poner la dirección del servidor este le ofrece una aplicación web.
+ La comunicación es por websockets.
+ El formato del protocolo, json y miembro *command*.
+ El servidor lleva la cuenta de los usuarios conectados.
+ Todos los elementos en pantalla son objetos globales, incluso la conexión (y la clase Game)
+ Abrir una nueva pestaña con la misma dirección.

### Demostración de la partida

+ El tablero es un canvas que dibuja por capas. El fondo, las piezas y los marcadores de casilla.
+ Empezar la partida como blancas.
+ El cliente envía petición de empezar la partida como blancas.
+ Otra petición de empezar la partida lo rechaza.
+ El servidor siempre da una respuesta al menos a un cliente.
+ El servidor envía el mensaje "empezar la partida" con los colores asignados.
+ El servidor envía a las blancas un mapa de movimientos válidos para las piezas.
+ Puedes arrastrar las piezas hacia las casillas indicadas.
+ Al soltar, el cliente envía el movimiento hecho y el servidor devuelve información sobre el movimiento hecho. Al otro cliente le envía el comando de comenzar turno, con una lista de movimientos legales.
+ La lista de movimiento legales incluyen el enroque, capturas al paso y la promoción.

### Petición de reiniciar la partida

+ Cualquier cliente puede pedir reiniciar la partida como las blancas.
+ Aparece un diálogo en el cliente contrario preguntando si lo permite.
+ Envía la respuesta al servidor.
+ En caso negativo se envía al otro cliente que no lo permite.
+ En caso afirmativo empezar la partida como blancas para el cliente que lo ha solicitado.

### Promoción

+ La promoción es detectada por el cliente
+ Ofrece un diálogo para elegir ficha.
+ Al seleccionar la pieza se envía el movimiento al servidor.

  