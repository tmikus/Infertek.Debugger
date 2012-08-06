if (!window.Infertek)
	window.Infertek = {};

var infertekDebugger = null;
var infertek_debugger_call_stack = "_callStack";
var infertek_debugger_function_call_overwritten = "infertek_debugger_function_call_overwritten";
var infertek_debugger_parent_object = "infertek_debugger_parent_object";
var infertek_debugger_beginCollectingCallStack = "_beginCollectingCallStack";

var attachFunctionCallTracker = function (object, childObjectsCollection, fullFunctionPath) {
    /// <summary>
    /// Attaches function call trackers to all child objects inside <see cref="childObjectsCollection" /> collection.
    /// </summary>
    /// <param name="object" type="Object">Object that is container for function to override.</param>
    /// <param name="childObjectsCollection" type="Object">Collection in which function is located.</param>
    
    for (var child in childObjectsCollection) {
        if (child == infertek_debugger_function_call_overwritten ||
            child == infertek_debugger_parent_object)
            continue;
        
        var childObject = childObjectsCollection[child];

        if (!childObject[infertek_debugger_parent_object]) {
            childObject[infertek_debugger_parent_object] = object;
            registerFunctionCallTracker(childObject, fullFunctionPath + "." + child);
        }
        
        if (typeof(childObject) == "function") {
            if (!childObject[infertek_debugger_function_call_overwritten])
                overwriteFunctionCall(object, childObjectsCollection, child, fullFunctionPath);
        }
    }
};

var overwriteFunctionCall = function (object, childObjectsCollection, functionName, fullFunctionPath) {
    /// <summary>
    /// Performs overriding of function call to allow handling exceptions.
    /// </summary>
    /// <param name="object" type="Object">Object that is container for function to override.</param>
    /// <param name="childObjectsCollection" type="Object">Collection in which function is located.</param>
    /// <param name="functionName" type="String">Name of function to overwrite.</param>
    
    var functionInstance = childObjectsCollection[functionName];
    functionInstance[infertek_debugger_function_call_overwritten] = true;

    var objectName = object === window ? "window" : object.name;
    var fullFunctionName = fullFunctionPath + "." + functionName;
    
    childObjectsCollection[functionName] = function() {
        infertekDebugger[infertek_debugger_beginCollectingCallStack] = false;
        try {
            functionInstance.apply(this, arguments);
        } catch (exception) {
            if (!infertekDebugger[infertek_debugger_beginCollectingCallStack]) {
                infertekDebugger[infertek_debugger_beginCollectingCallStack] = true;
                infertekDebugger[infertek_debugger_call_stack] = [ fullFunctionName ];
                infertekDebugger._exception = exception;
            } else {
                infertekDebugger[infertek_debugger_call_stack].push(fullFunctionName);
            }
            throw exception;
        }
    };
};

var registerFunctionCallTracker = function (object, fullFunctionPath) {
    /// <summary>
    /// Registers tracker for this and all child objects.
    /// </summary>
    /// <param name="object" type="Object">Object for which register function calls tracking.</param>
    
    if (typeof(object) == "function" && window[fullFunctionPath] && !object[infertek_debugger_function_call_overwritten]) {
        var functionPath = "window." + fullFunctionPath;
        overwriteFunctionCall(window, window, fullFunctionPath, functionPath);
    }

    attachFunctionCallTracker(object, object, fullFunctionPath);            // Attaching to object's global functions/objects.
    attachFunctionCallTracker(object, object.prototype, fullFunctionPath);  // Attaching to object's instance-aware functions/objects.
};

infertekDebugger = window.Infertek.Debugger = {
	_callStack: [],
	_exception: null,

	registerForDebugging: function (object, objectName) {
		/// <summary>
		/// Registers object for debugging purposes.
		/// </summary>
		/// <param name="object" type="Function">Function to be registered for debugging purposes.</param>

		registerFunctionCallTracker(object, objectName);
	}
};