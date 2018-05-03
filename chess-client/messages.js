class Messages {
    constructor(element){
        this.element = element;
    }

    add(content) {
        const p = document.createElement("p");
        p.innerText = content;
        this.element.appendChild(p);
        this.element.scrollTo(0, this.element.scrollHeight);
    }

}