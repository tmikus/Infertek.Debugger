var namespaceObject = {
    Function1: function () {
        this.Function2();   
    },
    Function2: function () {
        this.Function3();
    },
    Function3: function () {
        n;
    }
};

window.Infertek.Debugger.registerForDebugging(namespaceObject, "namespaceObject");

namespaceObject.Function1();