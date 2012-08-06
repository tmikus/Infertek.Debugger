//Infertek.Debugger v0.1.0 | (c) 2012 Tomasz Mikuś | http://www.opensource.org/licenses/mit-license
(function(window, undefined) {if (!window.Infertek)
	window.Infertek = {};

var infertekDebugger = null;
var infertek_debugger_call_stack = "_callStack";
var infertek_debugger_function_call_overwritten = "infertek_debugger_function_call_overwritten";
var infertek_debugger_parent_object = "infertek_debugger_parent_object";
var infertek_debugger_beginCollectingCallStack = "_beginCollectingCallStack";

var overwriteFunctionCall = function (object, childObjectsCollection, functionName, fullFunctionPath) {
    /// <summary>
    /// Performs overriding of function call to allow handling exceptions.
    /// </summary>
    /// <param name="object" type="Object">Object that is container for function to override.</param>
    /// <param name="childObjectsCollection" type="Object">Collection in which function is located.</param>
    /// <param name="functionName" type="String">Name of function to overwrite.</param>
    
    var functionInstance = childObjectsCollection[functionName];
    functionInstance[infertek_debugger_function_call_overwritten] = true;
    
    childObjectsCollection[functionName] = function() {
        infertekDebugger[infertek_debugger_beginCollectingCallStack] = false;
        try {
            return functionInstance.apply(this, arguments);
        } catch (exception) {
            if (!infertekDebugger[infertek_debugger_beginCollectingCallStack]) {
                infertekDebugger[infertek_debugger_beginCollectingCallStack] = true;
                infertekDebugger[infertek_debugger_call_stack] = [ fullFunctionPath ];
                infertekDebugger._exception = exception;
            } else {
                infertekDebugger[infertek_debugger_call_stack].push(fullFunctionPath);
            }
            throw exception;
        }
    };
    
    childObjectsCollection[functionName].prototype = functionInstance.prototype;
    
    for (var childElement in functionInstance) {
        childObjectsCollection[functionName][childElement] = functionInstance[childElement];
    }
};

var registerCallTracker = function (objectName, parent, parentName) {
    /// <summary>
    /// Registers tracker for this and all child objects.
    /// </summary>
    /// <param name="objectName" type="String">Name of the object to be registered for debugging purposes.</param>
    /// <param name="parent" type="Object">Instance of parent object.</param>
    /// <param name="parentName" type="String">Name of the parent object.</param>
    
    var object = parent[objectName];
    
    if (!object)
        throw "Object is not defined within '" + parentName + "' object!";
    
    var objectPath = parentName + "." + objectName;
    
    if (typeof(object) == "function" && !object[infertek_debugger_function_call_overwritten]) {
        overwriteFunctionCall(parent, parent, objectName, objectPath);
    }
    if (!object[infertek_debugger_parent_object]) {
        object[infertek_debugger_parent_object] = parent;
    }

    var objectsToLookupList = [];
    
    var initializeLists = function(object, objectsCollection, objectPath) {
        for (var childName in objectsCollection) {
            if (childName == infertek_debugger_function_call_overwritten ||
                childName == infertek_debugger_parent_object)
                continue;
            
            var childObject = objectsCollection[childName];
            
            if (childObject == null ||
                childObject[infertek_debugger_parent_object] ||
                childObject == window ||
                Node.prototype.isPrototypeOf(childObject) ||
                $.prototype.isPrototypeOf(childObject) ||
                typeof childObject === "string" ||
                typeof childObject === "number" ||
                typeof childObject === "boolean") {
                continue;
            }
            
            childObject[infertek_debugger_parent_object] = object;
            
            if (typeof(childObject) == "function") {
                if (!childObject[infertek_debugger_function_call_overwritten]) {
                    overwriteFunctionCall(object, objectsCollection, childName, objectPath + "." + childName);
                }
            }
            
            objectsToLookupList.push({
                object: childObject,
                fullObjectPath: objectPath + "." + childName
            });
        }  
    };
    
    initializeLists(object, object, objectPath);            // Attaching to object's global functions/objects.
    initializeLists(object, object.prototype, objectPath);  // Attaching to object's instance-aware functions/objects.
    
    for (var index = 0; index < objectsToLookupList.length; index++) {
        var childObjectDefinition = objectsToLookupList[index];
        
        initializeLists(childObjectDefinition.object, childObjectDefinition.object, childObjectDefinition.object, childObjectDefinition.fullObjectPath);            // Attaching to object's global functions/objects.
        initializeLists(childObjectDefinition.object, childObjectDefinition.object.prototype, childObjectDefinition.object, childObjectDefinition.fullObjectPath);  // Attaching to object's instance-aware functions/objects.
    }
};

infertekDebugger = window.Infertek.Debugger = {
	_callStack: [],
	_exception: null,

	registerForDebugging: function (objectName, parentObject, parentObjectName) {
		/// <summary>
		/// Registers object for debugging purposes.
		/// </summary>
		/// <param name="objectName" type="String">Name of the object to be registered for debugging purposes.</param>

		registerCallTracker(objectName, !parentObject ? window : parentObject, !parentObjectName ? "window" : parentObjectName);
	}
};})(window, undefined);