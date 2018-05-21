// Copyright (C) 2018  Oscar 'dotoscat' Garcia

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

class Messages {
    constructor(element, height){
        this.element = element;
        element.style.height = typeof height === 'number' ? height + 'px' : element.height + 'px';
    }

    add(content) {
        const p = document.createElement("p");
        p.innerText = content;
        this.element.appendChild(p);
        this.element.scrollTo(0, this.element.scrollHeight);
    }

    addToLast(content, separator){
        const sep = typeof separator === 'undefined' ? ' ' : separator;
        this.element.lastChild.innerText += sep + content;
    }

}