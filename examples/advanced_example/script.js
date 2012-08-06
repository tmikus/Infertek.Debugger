var namespaceObject = {
    Function1: function () {
        this.Function2();   
    },
    Function2: function () {
        this.Function3();
    },
    Function3: function () {
        var prywatnaFunkcja = function() {
            n;  
        };
        prywatnaFunkcja();
    }
};

window.Infertek.Debugger.registerForDebugging("namespaceObject");

namespaceObject.Function1();