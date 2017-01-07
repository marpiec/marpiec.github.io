var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var PositionXY = (function () {
    function PositionXY(x, y) {
        this.x = x;
        this.y = y;
    }
    return PositionXY;
}());
var d3tools;
(function (d3tools) {
    var DragBehavior = (function () {
        function DragBehavior(selection) {
            this.draggedDistance = 0;
            this.selection = selection;
        }
        DragBehavior.prototype.init = function () {
            var drag = d3.behavior.drag()
                .origin(this.dragOriginInternal())
                .on("dragstart", this.internalStart())
                .on("drag", this.internalDragged())
                .on("dragend", this.internalEnd());
            this.selection.call(drag);
        };
        DragBehavior.prototype.isInPlaceClick = function () {
            return this.draggedDistance < 8;
        };
        DragBehavior.prototype.dragOriginInternal = function () {
            var externalThis = this;
            return function (d) {
                var x = d3.mouse(document.body)[0];
                var y = d3.mouse(document.body)[1];
                var eventTarget = d3.select(this);
                var origin = externalThis.dragOrigin(eventTarget, new PositionXY(x, y), d);
                this["__origin__"] = origin;
                this["__origin_mouse__"] = new PositionXY(x, y);
                return origin;
            };
        };
        DragBehavior.prototype.internalStart = function () {
            var externalThis = this;
            return function (d) {
                externalThis.draggedDistance = 0;
                var eventTarget = d3.select(this);
                var origin = this["__origin__"];
                var originMouse = this["__origin_mouse__"];
                var eventX = origin.x + d3.mouse(document.body)[0] - originMouse.x;
                var eventY = origin.y + d3.mouse(document.body)[1] - originMouse.y;
                this["__last_position__"] = { x: eventX, y: eventY };
                externalThis.dragStarted(eventTarget, new PositionXY(eventX, eventY), d);
            };
        };
        DragBehavior.prototype.internalDragged = function () {
            var externalThis = this;
            return function (d) {
                externalThis.draggedDistance++;
                var eventTarget = d3.select(this);
                var origin = this["__origin__"];
                var originMouse = this["__origin_mouse__"];
                var eventX = origin.x + d3.mouse(document.body)[0] - originMouse.x;
                var eventY = origin.y + d3.mouse(document.body)[1] - originMouse.y;
                this["__last_position__"] = { x: eventX, y: eventY };
                externalThis.dragged(eventTarget, new PositionXY(eventX, eventY), d);
            };
        };
        DragBehavior.prototype.internalEnd = function () {
            var externalThis = this;
            return function (d) {
                var eventTarget = d3.select(this);
                delete this["__origin__"];
                delete this["__origin_mouse__"];
                var lastPosition = this["__last_position__"];
                delete this["__last_position__"];
                externalThis.dragEnded(eventTarget, new PositionXY(lastPosition.x, lastPosition.y), d);
            };
        };
        return DragBehavior;
    }());
    d3tools.DragBehavior = DragBehavior;
})(d3tools || (d3tools = {}));
var graph;
(function (graph) {
    var DragMode;
    (function (DragMode) {
        DragMode[DragMode["dragNode"] = 0] = "dragNode";
        DragMode[DragMode["drawEdge"] = 1] = "drawEdge";
    })(DragMode = graph.DragMode || (graph.DragMode = {}));
    var GraphViewModel = (function () {
        function GraphViewModel(nodes, edges) {
            this.dragMode = DragMode.dragNode;
            this.nodesRadius = 30;
            this.nodes = nodes;
            this.edges = edges;
            this.activeElement = null;
        }
        GraphViewModel.empty = function () {
            return new GraphViewModel([], []);
        };
        GraphViewModel.prototype.nodeById = function (id) {
            return _(this.nodes).find(function (n) { return n.id === id; });
        };
        GraphViewModel.prototype.nodeByPosition = function (position) {
            var _this = this;
            var matchingNodes = this.nodes.filter(function (n) {
                return Math.pow(n.position.x - position.x, 2) + Math.pow(n.position.y - position.y, 2) < _this.nodesRadius * _this.nodesRadius;
            });
            if (matchingNodes.length > 0) {
                return matchingNodes[0];
            }
            else {
                return null;
            }
        };
        return GraphViewModel;
    }());
    graph.GraphViewModel = GraphViewModel;
    var GraphNode = (function () {
        function GraphNode(id, position) {
            this.id = id;
            this.position = position;
        }
        return GraphNode;
    }());
    graph.GraphNode = GraphNode;
    var GraphEdge = (function () {
        function GraphEdge(id, fromNodeId, toNodeId) {
            this.id = id;
            this.fromNodeId = fromNodeId;
            this.toNodeId = toNodeId;
        }
        return GraphEdge;
    }());
    graph.GraphEdge = GraphEdge;
})(graph || (graph = {}));
var graph;
(function (graph) {
    var GraphCommandBus = (function () {
        function GraphCommandBus(model) {
            this.updateListeners = [];
            this.model = model;
        }
        GraphCommandBus.prototype.registerUpdateListener = function (listener) {
            this.updateListeners.push(listener);
        };
        GraphCommandBus.prototype.callUpdateListeners = function () {
            this.updateListeners.forEach(function (listener) { return listener(); });
        };
        GraphCommandBus.prototype.activateElement = function (element) {
            this.model.activeElement = element;
            this.callUpdateListeners();
        };
        GraphCommandBus.prototype.deleteActiveElement = function () {
            if (this.model.activeElement instanceof graph.GraphNode) {
                this.deleteNode(this.model.activeElement);
            }
            else if (this.model.activeElement instanceof graph.GraphEdge) {
                this.deleteEdge(this.model.activeElement);
            }
        };
        GraphCommandBus.prototype.deleteEdge = function (edge) {
            this.model.edges = this.model.edges.filter(function (e) { return e !== edge; });
            this.callUpdateListeners();
        };
        GraphCommandBus.prototype.deleteNode = function (node) {
            this.model.nodes = this.model.nodes.filter(function (n) { return n !== node; });
            this.model.edges = this.model.edges.filter(function (e) { return e.fromNodeId !== node.id && e.toNodeId != node.id; });
            this.callUpdateListeners();
        };
        GraphCommandBus.prototype.addNode = function (x, y) {
            var maxId = 0;
            this.model.nodes.forEach(function (n) { return maxId = Math.max(maxId, n.id); });
            var node = new graph.GraphNode(maxId + 1, new PositionXY(x, y));
            this.model.nodes.push(node);
            this.model.activeElement = node;
            this.callUpdateListeners();
            return node;
        };
        GraphCommandBus.prototype.toggleDragMode = function () {
            if (this.model.dragMode === graph.DragMode.dragNode) {
                this.model.dragMode = graph.DragMode.drawEdge;
            }
            else {
                this.model.dragMode = graph.DragMode.dragNode;
            }
            this.callUpdateListeners();
        };
        GraphCommandBus.prototype.updateNodePosition = function (node, position) {
            node.position = position;
            this.callUpdateListeners();
        };
        GraphCommandBus.prototype.addEdgeIfPossible = function (fromNode, position) {
            var toNode = this.model.nodeByPosition(position);
            if (toNode) {
                var edgeNotYetExists = this.model.edges.filter(function (e) { return e.fromNodeId === fromNode.id && e.toNodeId === toNode.id ||
                    e.fromNodeId === toNode.id && e.toNodeId === fromNode.id; }).length == 0;
                var differentNodes = fromNode.id !== toNode.id;
                if (edgeNotYetExists && differentNodes) {
                    this.addEdge(fromNode, toNode);
                }
            }
            else {
                var newNode = this.addNode(position.x, position.y);
                this.addEdge(fromNode, newNode);
            }
        };
        GraphCommandBus.prototype.addEdge = function (fromNode, toNode) {
            var maxId = 0;
            this.model.edges.forEach(function (n) { return maxId = Math.max(maxId, n.id); });
            this.model.edges.push(new graph.GraphEdge(maxId + 1, fromNode.id, toNode.id));
            this.model.activeElement = toNode;
            this.callUpdateListeners();
        };
        return GraphCommandBus;
    }());
    graph.GraphCommandBus = GraphCommandBus;
})(graph || (graph = {}));
var graph;
(function (graph) {
    var DragBehavior = d3tools.DragBehavior;
    var GraphNodeDrag = (function (_super) {
        __extends(GraphNodeDrag, _super);
        function GraphNodeDrag(selection, commandBus) {
            var _this = _super.call(this, selection) || this;
            _this.commandBus = commandBus;
            return _this;
        }
        GraphNodeDrag.enable = function (selection, commandBus) {
            new GraphNodeDrag(selection, commandBus).init();
        };
        GraphNodeDrag.prototype.dragOrigin = function (draggedElement, eventPosition, model) {
            return { x: model.position.x, y: model.position.y };
        };
        GraphNodeDrag.prototype.dragStarted = function (draggedElement, eventPosition, model) {
            this.commandBus.activateElement(model);
            this.commandBus.updateNodePosition(model, eventPosition);
        };
        GraphNodeDrag.prototype.dragged = function (draggedElement, eventPosition, model) {
            this.commandBus.updateNodePosition(model, eventPosition);
        };
        GraphNodeDrag.prototype.dragEnded = function (draggedElement, eventPosition, model) {
            this.commandBus.updateNodePosition(model, eventPosition);
        };
        return GraphNodeDrag;
    }(DragBehavior));
    graph.GraphNodeDrag = GraphNodeDrag;
    var GraphNodeEdgeDraw = (function (_super) {
        __extends(GraphNodeEdgeDraw, _super);
        function GraphNodeEdgeDraw(selection, commandBus, model, edgeMock, graphCanvas) {
            var _this = _super.call(this, selection) || this;
            _this.commandBus = commandBus;
            _this.model = model;
            _this.edgeMock = edgeMock;
            _this.graphCanvas = graphCanvas;
            return _this;
        }
        GraphNodeEdgeDraw.enable = function (selection, commandBus, model, edgeMock, graphCanvas) {
            new GraphNodeEdgeDraw(selection, commandBus, model, edgeMock, graphCanvas).init();
        };
        GraphNodeEdgeDraw.prototype.dragOrigin = function (draggedElement, eventPosition, model) {
            return { x: eventPosition.x, y: eventPosition.y };
        };
        GraphNodeEdgeDraw.prototype.dragStarted = function (draggedElement, eventPosition, model) {
            this.commandBus.activateElement(model);
            this.graphCanvas
                .classed("dragMode", true);
            this.edgeMock
                .classed("hidden", false)
                .attr("x1", model.position.x)
                .attr("y1", model.position.y)
                .attr("x2", eventPosition.x)
                .attr("y2", eventPosition.y);
        };
        GraphNodeEdgeDraw.prototype.dragged = function (draggedElement, eventPosition, model) {
            var node = this.model.nodeByPosition(eventPosition);
            this.edgeMock
                .attr("x1", model.position.x)
                .attr("y1", model.position.y);
            if (node) {
                this.edgeMock
                    .attr("x2", node.position.x)
                    .attr("y2", node.position.y);
            }
            else {
                this.edgeMock
                    .attr("x2", eventPosition.x)
                    .attr("y2", eventPosition.y);
            }
        };
        GraphNodeEdgeDraw.prototype.dragEnded = function (draggedElement, eventPosition, model) {
            this.edgeMock
                .classed("hidden", true);
            this.graphCanvas
                .classed("dragMode", false);
            this.commandBus.addEdgeIfPossible(model, eventPosition);
        };
        return GraphNodeEdgeDraw;
    }(DragBehavior));
    graph.GraphNodeEdgeDraw = GraphNodeEdgeDraw;
})(graph || (graph = {}));
var graph;
(function (graph) {
    var GraphController = (function () {
        function GraphController(container, model, commandBus) {
            var _this = this;
            this.model = model;
            this.commandBus = commandBus;
            container.html("\n                <svg class=\"canvas\">\n                    <g class=\"edgesLayer\"></g>\n                    <line class=\"edgeMock hidden\"></line>\n                    <g class=\"nodesLayer\"></g>              \n                </svg>\n                <button class=\"dragModeButton\"><i class=\"fa fa-pencil\" aria-hidden=\"true\"></i></button>");
            this.dragModeButton = container.select(".dragModeButton");
            this.canvas = container.select(".canvas");
            this.edgesLayer = container.select(".edgesLayer");
            this.nodesLayer = container.select(".nodesLayer");
            this.edgeMock = container.select(".edgeMock");
            d3.select(window).on('resize', function () {
                _this.updateContainerSize();
            });
            d3.select("body").on("keydown", function () {
                var deleteKeyCode = 46;
                if (d3.event.keyCode === deleteKeyCode) {
                    _this.commandBus.deleteActiveElement();
                }
            });
            this.canvas.on("dblclick", function () {
                var mouseEvent = d3.event;
                _this.commandBus.addNode(mouseEvent.x, mouseEvent.y);
            });
            this.updateContainerSize();
            this.commandBus.registerUpdateListener(function () {
                _this.updateView();
            });
            this.dragModeButton.on("mousedown", function () {
                _this.commandBus.toggleDragMode();
            });
        }
        GraphController.prototype.updateContainerSize = function () {
            var width = window.innerWidth
                || document.documentElement.clientWidth
                || document.body.clientWidth;
            var height = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight;
            this.canvas
                .attr("width", width)
                .attr("height", height);
        };
        GraphController.prototype.updateView = function () {
            this.updateEdgesView();
            this.updateNodesView();
            this.updateButtonsView();
            this.initNodesDrag();
        };
        GraphController.prototype.updateEdgesView = function () {
            var _this = this;
            var edges = this.edgesLayer.selectAll("line.graphEdge")
                .data(this.model.edges);
            edges.enter()
                .append("line")
                .classed("graphEdge", true);
            edges.exit()
                .remove();
            this.edgesLayer.selectAll("line.graphEdge")
                .attr("x1", function (d) { return _this.model.nodeById(d.fromNodeId).position.x; })
                .attr("y1", function (d) { return _this.model.nodeById(d.fromNodeId).position.y; })
                .attr("x2", function (d) { return _this.model.nodeById(d.toNodeId).position.x; })
                .attr("y2", function (d) { return _this.model.nodeById(d.toNodeId).position.y; })
                .classed("active", function (d) { return _this.model.activeElement === d; })
                .on("mousedown", function (d) {
                _this.commandBus.activateElement(d);
                d3.event.preventDefault();
            });
        };
        GraphController.prototype.updateNodesView = function () {
            var _this = this;
            var nodes = this.nodesLayer.selectAll("circle.graphNode")
                .data(this.model.nodes);
            nodes.enter()
                .append("circle")
                .classed("graphNode", true);
            nodes.exit()
                .remove();
            this.nodesLayer.selectAll("circle.graphNode")
                .attr("cx", function (d) { return d.position.x; })
                .attr("cy", function (d) { return d.position.y; })
                .attr("r", this.model.nodesRadius)
                .classed("active", function (d) { return _this.model.activeElement === d; });
        };
        GraphController.prototype.initNodesDrag = function () {
            if (this.model.dragMode === graph.DragMode.dragNode) {
                graph.GraphNodeDrag.enable(this.nodesLayer.selectAll("circle.graphNode"), this.commandBus);
            }
            else if (this.model.dragMode === graph.DragMode.drawEdge) {
                graph.GraphNodeEdgeDraw.enable(this.nodesLayer.selectAll("circle.graphNode"), this.commandBus, this.model, this.edgeMock, this.canvas);
            }
        };
        GraphController.prototype.updateButtonsView = function () {
            this.dragModeButton
                .classed("enabled", this.model.dragMode === graph.DragMode.drawEdge);
        };
        return GraphController;
    }());
    graph.GraphController = GraphController;
})(graph || (graph = {}));
var main;
(function (main) {
    var GraphController = graph.GraphController;
    var GraphCommandBus = graph.GraphCommandBus;
    var GraphModel = graph.GraphViewModel;
    var Main = (function () {
        function Main() {
            var model = GraphModel.empty();
            var commandBus = new GraphCommandBus(model);
            var mainContainer = d3.select("#main");
            this.graphController = new GraphController(mainContainer, model, commandBus);
        }
        Main.prototype.start = function () {
            this.graphController.updateView();
        };
        return Main;
    }());
    main.Main = Main;
    new Main().start();
})(main || (main = {}));

//# sourceMappingURL=../maps/main-7a427b85aa.js.map
