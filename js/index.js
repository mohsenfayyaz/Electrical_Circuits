var actionSocket = new Rete.Socket('Action');
var dataSocket = new Rete.Socket('Data');

var input = new Rete.Socket('Data');
var output = new Rete.Socket('Data');

const numSocket = new Rete.Socket('Number');


class ResistorComponent extends Rete.Component {
    constructor() {
        super('Resistor');
        this.task = {
            outputs: {}
        }
    }

    builder(node) {
        node.addInput(new Rete.Input('input', 'In', numSocket));
        node.addOutput(new Rete.Output('output', 'Out', numSocket));

        var ctrl = new MessageControl(this.editor, node.data.num);
        node.addControl(ctrl)
    }

    worker(node, inputs, outputs) {
        outputs[0] = node.data.num;
    }
}

class VoltageSourceComponent extends Rete.Component {
    constructor() {
        super('Vs');
        this.task = {
            outputs: {}
        }
    }

    builder(node) {
        node.addInput(new Rete.Input('input', 'In', numSocket));
        node.addOutput(new Rete.Output('output', 'Out', numSocket));

        var ctrl = new MessageControl(this.editor, node.data.num);
        node.addControl(ctrl)
    }

    worker(node, inputs, outputs) {
        outputs[0] = node.data.num;
    }
}

class VoltageSourceReverseComponent extends Rete.Component {
    constructor() {
        super('Vs Reverse');
        this.task = {
            outputs: {}
        }
    }

    builder(node) {
        node.addInput(new Rete.Input('input', 'In', numSocket));
        node.addOutput(new Rete.Output('output', 'Out', numSocket));

        var ctrl = new MessageControl(this.editor, node.data.num);
        node.addControl(ctrl)
    }

    worker(node, inputs, outputs) {
        outputs[0] = node.data.num;
    }
}


class CurrentSourceComponent extends Rete.Component {
    constructor() {
        super('Is');
        this.task = {
            outputs: {}
        }
    }

    builder(node) {
        node.addInput(new Rete.Input('input', 'In', numSocket));
        node.addOutput(new Rete.Output('output', 'Out', numSocket));

        var ctrl = new MessageControl(this.editor, node.data.num);
        node.addControl(ctrl)
    }

    worker(node, inputs, outputs) {
        outputs[0] = node.data.num;
    }
}

class CurrentSourceReverseComponent extends Rete.Component {
    constructor() {
        super('Is Reverse');
        this.task = {
            outputs: {}
        }
    }

    builder(node) {
        node.addInput(new Rete.Input('input', 'In', numSocket));
        node.addOutput(new Rete.Output('output', 'Out', numSocket));

        var ctrl = new MessageControl(this.editor, node.data.num);
        node.addControl(ctrl)
    }

    worker(node, inputs, outputs) {
        outputs[0] = node.data.num;
    }
}

class NodeComponent extends Rete.Component {
    constructor() {
        super('Node');
        this.task = {
            outputs: {}
        }
    }

    builder(node) {
        node.addInput(new Rete.Input('input0', 'In', numSocket));
        node.addInput(new Rete.Input('input1', 'In', numSocket));
        node.addInput(new Rete.Input('input2', 'In', numSocket));
        node.addInput(new Rete.Input('input3', 'In', numSocket));
        node.addOutput(new Rete.Output('output0', 'Out', numSocket));
        node.addOutput(new Rete.Output('output1', 'Out', numSocket));
        node.addOutput(new Rete.Output('output2', 'Out', numSocket));
        node.addOutput(new Rete.Output('output3', 'Out', numSocket));
        node.addControl(new MessageControl(this.editor, node.data.num));

    }

    worker(node, inputs, outputs) {
        outputs[0] = node.data.num;
    }
}



// ----------------------------

var eventHandlers = {
    list: [],
    remove() {
        this
            .list
            .forEach(h => {
                document.removeEventListener('keydown', h);
            });
        this.list = [];
    },
    add(name, h) {
        document.addEventListener(name, h, false);
        this
            .list
            .push(h);
    }
};



class MessageControl extends Rete.Control {

    constructor(emitter, msg) {
        super('preview');
        this.emitter = emitter;
        this.template = '<input :value="msg" :class="preview" @input="change($event)"/>';

        this.scope = {
            msg,
            change: this.change.bind(this)
        };
    }

    change(e) {
        this.scope.value = +e.target.value;
        this.update();
    }

    update() {
        this.putData('msg', this.scope.value)
        this.emitter.trigger('process');
        this._alight.scan();
    }

    mounted() {
        this.scope.value = this.getData('msg') || 0;
        this.update();
    }

    setValue(val) {
        this.scope.value = val;
        this.scope.msg = val;
        this._alight.scan()
    }
}


class KeydownComponent extends Rete.Component {

    constructor() {
        super('Keydown event');
        this.task = {
            outputs: {
                act: 'option',
                key: 'output'
            },
            init(task) {
                eventHandlers.remove();
                eventHandlers.add('keydown', function (e) {
                    task.run(e.keyCode);
                    task.reset();
                });
            }
        }
    }

    builder(node) {
        node.addOutput(new Rete.Output('act', '', actionSocket))
        node.addOutput(new Rete.Output('key', 'Key code', dataSocket));
    }

    worker(node, inputs, data) {
        console.log('Keydown event', node.id, data);
        return {
            key: data
        }
    }
}

class EnterPressComponent extends Rete.Component {

    constructor() {
        super('Enter pressed');
        this.task = {
            outputs: {
                then: 'option',
                else: 'option'
            }
        }
    }

    builder(node) {

        node
            .addInput(new Rete.Input('act', '', actionSocket))
            .addInput(new Rete.Input('key', 'Key code', dataSocket))
            .addOutput(new Rete.Output('then', 'Then', actionSocket))
            .addOutput(new Rete.Output('else', 'Else', actionSocket));
    }

    worker(node, inputs, outputs) {
        if (inputs['key'][0] == 13)
            this.closed = ['else'];
        else
            this.closed = ['then'];

        console.log('Print', node.id, inputs);
    }
}

class AlertComponent extends Rete.Component {

    constructor() {
        super('Alert');
        this.task = {
            outputs: {}
        }
    }

    builder(node) {
        var ctrl = new MessageControl(this.editor, node.data.msg);

        node
            .addControl(ctrl)
            .addInput(new Rete.Input('act', '', actionSocket));
    }

    worker(node, inputs) {
        console.log('Alert', node.id, node.data);
        // alert(node.data.msg);
    }
}

var components = [new NodeComponent, new ResistorComponent, new VoltageSourceComponent, new VoltageSourceReverseComponent, new CurrentSourceComponent, new CurrentSourceReverseComponent];
var container = document.querySelector('#rete')


var editor = new Rete.NodeEditor('tasksample@0.1.0', container);
editor.use(AlightRenderPlugin);
editor.use(ConnectionPlugin);
editor.use(ContextMenuPlugin);
editor.use(TaskPlugin);
//editor.use(CommentPlugin);

var engine = new Rete.Engine('tasksample@0.1.0');

components.map(c => {
    editor.register(c);
    engine.register(c);
});


editor.on('connectioncreate connectionremove nodecreate noderemove', () => {
    if (editor.silent) return;

    compile();
});




async function compile() {
    await engine.abort();
    await engine.process(editor.toJSON());
}


var data = {
    "id": "tasksample@0.1.0",
    "nodes": {
        "23": {
            "id": 23,
            "data": {
                "msg": 11
            },
            "inputs": {
                "input": {
                    "connections": [{
                        "node": 31,
                        "output": "output0",
                        "data": {}
                    }]
                }
            },
            "outputs": {
                "output": {
                    "connections": [{
                        "node": 29,
                        "input": "input3",
                        "data": {}
                    }]
                }
            },
            "position": [
                620,
                400
            ],
            "name": "Resistor"
        },
        "24": {
            "id": 24,
            "data": {
                "msg": 7
            },
            "inputs": {
                "input": {
                    "connections": [{
                        "node": 28,
                        "output": "output3",
                        "data": {}
                    }]
                }
            },
            "outputs": {
                "output": {
                    "connections": [{
                        "node": 29,
                        "input": "input0",
                        "data": {}
                    }]
                }
            },
            "position": [
                364,
                157
            ],
            "name": "Vs"
        },
        "25": {
            "id": 25,
            "data": {
                "msg": 5
            },
            "inputs": {
                "input": {
                    "connections": [{
                        "node": 29,
                        "output": "output3",
                        "data": {}
                    }]
                }
            },
            "outputs": {
                "output": {
                    "connections": [{
                        "node": 30,
                        "input": "input0",
                        "data": {}
                    }]
                }
            },
            "position": [
                863,
                158
            ],
            "name": "Resistor"
        },
        "26": {
            "id": 26,
            "data": {
                "msg": 3
            },
            "inputs": {
                "input": {
                    "connections": [{
                        "node": 31,
                        "output": "output3",
                        "data": {}
                    }]
                }
            },
            "outputs": {
                "output": {
                    "connections": [{
                        "node": 30,
                        "input": "input3",
                        "data": {}
                    }]
                }
            },
            "position": [
                1015,
                556
            ],
            "name": "Vs"
        },
        "27": {
            "id": 27,
            "data": {
                "msg": 6
            },
            "inputs": {
                "input": {
                    "connections": [{
                        "node": 28,
                        "output": "output2",
                        "data": {}
                    }]
                }
            },
            "outputs": {
                "output": {
                    "connections": [{
                        "node": 31,
                        "input": "input1",
                        "data": {}
                    }]
                }
            },
            "position": [
                178,
                580
            ],
            "name": "Resistor"
        },
        "28": {
            "id": 28,
            "data": {
                "msg": 0
            },
            "inputs": {
                "input0": {
                    "connections": []
                },
                "input1": {
                    "connections": []
                },
                "input2": {
                    "connections": []
                },
                "input3": {
                    "connections": []
                }
            },
            "outputs": {
                "output0": {
                    "connections": []
                },
                "output1": {
                    "connections": []
                },
                "output2": {
                    "connections": [{
                        "node": 27,
                        "input": "input",
                        "data": {}
                    }]
                },
                "output3": {
                    "connections": [{
                        "node": 24,
                        "input": "input",
                        "data": {}
                    }]
                }
            },
            "position": [
                89,
                67
            ],
            "name": "Node"
        },
        "29": {
            "id": 29,
            "data": {
                "msg": 0
            },
            "inputs": {
                "input0": {
                    "connections": [{
                        "node": 24,
                        "output": "output",
                        "data": {}
                    }]
                },
                "input1": {
                    "connections": []
                },
                "input2": {
                    "connections": []
                },
                "input3": {
                    "connections": [{
                        "node": 23,
                        "output": "output",
                        "data": {}
                    }]
                }
            },
            "outputs": {
                "output0": {
                    "connections": []
                },
                "output1": {
                    "connections": []
                },
                "output2": {
                    "connections": []
                },
                "output3": {
                    "connections": [{
                        "node": 25,
                        "input": "input",
                        "data": {}
                    }]
                }
            },
            "position": [
                618,
                26
            ],
            "name": "Node"
        },
        "30": {
            "id": 30,
            "data": {
                "msg": 0
            },
            "inputs": {
                "input0": {
                    "connections": [{
                        "node": 25,
                        "output": "output",
                        "data": {}
                    }]
                },
                "input1": {
                    "connections": []
                },
                "input2": {
                    "connections": []
                },
                "input3": {
                    "connections": [{
                        "node": 26,
                        "output": "output",
                        "data": {}
                    }]
                }
            },
            "outputs": {
                "output0": {
                    "connections": []
                },
                "output1": {
                    "connections": []
                },
                "output2": {
                    "connections": []
                },
                "output3": {
                    "connections": []
                }
            },
            "position": [
                1136,
                86
            ],
            "name": "Node"
        },
        "31": {
            "id": 31,
            "data": {
                "msg": -1
            },
            "inputs": {
                "input0": {
                    "connections": []
                },
                "input1": {
                    "connections": [{
                        "node": 27,
                        "output": "output",
                        "data": {}
                    }]
                },
                "input2": {
                    "connections": []
                },
                "input3": {
                    "connections": []
                }
            },
            "outputs": {
                "output0": {
                    "connections": [{
                        "node": 23,
                        "input": "input",
                        "data": {}
                    }]
                },
                "output1": {
                    "connections": []
                },
                "output2": {
                    "connections": []
                },
                "output3": {
                    "connections": [{
                        "node": 26,
                        "input": "input",
                        "data": {}
                    }]
                }
            },
            "position": [
                619,
                556
            ],
            "name": "Node"
        }
    }
}

editor.fromJSON(data).then(() => {
    editor.view.resize();
    compile();
});

var data = editor.toJSON();
//document.getElementById("data").innerHTML = data;
console.log(data);




// --------------Functions---------
function run() {
    var url = "php/index.php";
    var data = editor.toJSON();
    var jsonData = JSON.stringify(data, undefined, 2);
    document.getElementById("data").innerHTML = "Loading...";
    postRequest(url, jsonData, this.editor);
    

    //document.getElementById("data").innerHTML = jsonData;
    console.log(data);

    //console.log(this.editor.nodes.find(n => n.id == 15).controls.entries().next().value[1]);
    //this.editor.nodes.find(n => n.id == 23).controls.entries().next().value[1].setValue("2V");
    //console.log(this.editor.nodes.find(n => n.id == 15));
}


function postRequest(url, jsonData, editor) {
    var xhr = new XMLHttpRequest();
    //var url = "url";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log(xhr.responseText);
            document.getElementById("data").innerHTML = xhr.responseText;
            try{
                var json = JSON.parse(xhr.responseText);
                printResponse(json);
            }catch(e){
                document.getElementById("data").innerHTML = xhr.responseText;
            }
            //alert(xhr.responseText);
            //printResponse(xhr.responseText)
        }
    };
    //var data = JSON.stringify({ "email": "hey@mail.com", "password": "101010" });
    var data = jsonData;
    xhr.send(data);
}

function printResponse(res) {
    console.log(res);
    logPrint = "";
    for (instance in res['data']) {
        if (res['data'][instance]["type"] == "NodeVoltage") {
            volt = Math.round(res['data'][instance]["value"] * 1000) / 1000
            editor.nodes.find(n => n.id == instance).controls.entries().next().value[1].setValue(volt + " V");
            logPrint += "NodeId: "+instance+" | Voltage: "+volt+" V <br>";
        }else{
            volt = Math.round(res['data'][instance]["volt"] * 1000) / 1000
            curr = Math.round(res['data'][instance]["value"] * 1000) / 1000
            logPrint += "VSId: "+instance+" | Voltage: "+volt+" V" + " | Current: "+curr+" A <br>";
        }
    }

    document.getElementById("data").innerHTML = logPrint;
}