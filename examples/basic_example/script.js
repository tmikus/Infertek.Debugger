var namespaceObject = {
    FunctionToDebug: function() {
        console.log("Content od the debugged method.");
        n;
    }
};

window.Infertek.Debugger.registerForDebugging(namespaceObject, "namespaceObject");

namespaceObject.FunctionToDebug();