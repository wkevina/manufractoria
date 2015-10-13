
/**
 * @class Stage
 * Manages a stack of layers
 *
 * @param {Snap.Element} paper Snap parent element
 */

class Stage {
    constructor(paper) {
        this.paper = paper;

        this.layers = [];

        this._layer = paper.g();
    }

    /**
     * push
     * Place object at front of stage and display its layer
     * @param {Object} layer Object with `_layer` property, which is a Snap.Element
     * @return layer
     */
    push(layer) {
        this.layers.push(layer);
        this._layer.clear();
        this._layer.add(layer._layer);

        return layer;
    }

    /**
     * pop
     * Remove topmost object from stage, removing its `_layer` property and calling `remove`
     * @return The popped object
     */
    pop() {
        const last = this.layers.pop();

        if (last) {
            last.remove();
        }

        this._layer.clear();

        const lastIndex = this.layers.length;

        if (lastIndex > 0) {
            this._layer.add(this.layers[lastIndex - 1]._layer);
        }

        return last;

    }

}
