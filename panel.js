
class Picker {

    constructor(root) {
        let args = {
            el: null, 		// Root element for picker
            children: "*",		// Selector for children
            class: "picker-selected"// Class to add to picked children
        };

        if (_.isUndefined(root))
            console.log("Must pass argument to Picker constructor");

        if (_.isObject(root))
            args = _.defaults(_.clone(root), args);
        else
            args.el = root;

        if (_.isString(args.el)) {
            args.el = document.querySelector(args.el);
        } else if (!_.isElement(args.el)) {
            console.log("Must pass string or element to picker");
        }

        // copy properties to this
        _.extend(this, args);
        this._assignHandlers();
    }

    _assignHandlers() {
        var children = this.el.querySelectorAll(this.children);

        for (var child of children) {
            child.addEventListener("click", this._clickHandler.bind(this));
        }
    }

    _clickHandler(mouseEvt) {
        console.log("Clicked");

        for (let child of this.el.querySelectorAll(this.children)) {
            child.classList.remove(this.class);
        }

        let elem = mouseEvt.currentTarget;
        elem.classList.add(this.class);
    }

};

var p = new Picker({
    el: "#container",
    class: "picked",
    children: "*"
});
