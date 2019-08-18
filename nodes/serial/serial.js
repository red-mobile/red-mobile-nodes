module.exports = function(RED) {
    'use strcit';

    const axios = require('axios');
    const qs = require('qs');
    const EventEmitter = require('events').EventEmitter;
    const WebSocketClient = require('../WebSocketClient');
    const BASE_URL = 'http://127.0.0.1';
    const PATH =  '/mobile';

    function getPostConfig(json){
        const config = {
            baseURL: BASE_URL + ":" + RED.settings.redMobilePort,
            url: PATH,
            method: "post",
            data: qs.stringify(json),
            headers: {
                'Authorization': "Bearer: " + RED.settings.redMobileAccessKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        return config;
    }

    function RedMobileSerialOpenNode(n) {
        RED.nodes.createNode(this, n);
        let node = this;
        node.opts = {
            baudRate: n.baudRate,
            dataBits: n.dataBits,
            stopBits: n.stopBits,
            parity: n.parity,
            dtr: n.dtr,
            rts: n.rts
        };

        node.on('input', function(msg) {
            const json =  {
                method: "serial-open",
                payload: msg.payload,
                opts: node.opts
            };

            axios.request(getPostConfig(json)).then((res) => {
                msg.payload = res.data;
                node.send(msg);
                node.status({
                    fill: "blue",
                    shape: "dot",
                    text: "success"
                });
            }).catch((error) => {
                node.error(RED._("serial-open.errors.response"));
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: RED._("serial-open.errors.response")
                });
            });
        });
    }

    RED.nodes.registerType("serial-open", RedMobileSerialOpenNode);

    function RedMobileSerialCloseNode(n) {
        RED.nodes.createNode(this, n);
        let node = this;

        node.on('input', function(msg) {
            let config = {
                baseURL: BASE_URL + ":" + RED.settings.redMobilePort,
                url: PATH,
                method: 'get',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': "Bearer: " + RED.settings.redMobileAccessKey
                },
                params: {
                    method: "serial-close"
                },
                timeout: 5000
            };

            axios.request(config).then((res) => {
                msg.payload = res.data;
                node.send(msg);
                node.status({
                    fill: "blue",
                    shape: "dot",
                    text: "success"
                });
            }).catch((error) => {
                node.error(RED._("serial-close.errors.response"));
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: RED._("serial-close.errors.response")
                });
            });
        });
    }

    RED.nodes.registerType("serial-close", RedMobileSerialCloseNode);

    function RedMobileSerialWriteNode(n) {
        RED.nodes.createNode(this, n);
        let node = this;
        node.data = n.data;

        node.on('input', function(msg) {
            if(node.data.length === 0){
                if(msg.payload !== undefined){
                    node.data = msg.payload;
                }else{
                    node.error(RED._("serial-write.errors.payload"));
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: RED._("serial-write.errors.payload")
                    });
                }
            }
            const json =  {
                method: "serial-write",
                payload: node.data
            };

            axios.request(getPostConfig(json)).then((res) => {
                msg.payload = res.data;
                node.send(msg);
                node.status({
                    fill: "blue",
                    shape: "dot",
                    text: "success"
                });
            }).catch((error) => {
                node.error(RED._("serial-write.errors.response"));
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: RED._("serial-write.errors.response")
                });
            });
        });
    }

    RED.nodes.registerType("serial-write", RedMobileSerialWriteNode);

    function RedMobileSerialReadNode(n) {
        RED.nodes.createNode(this, n);
        let node = this;
        const ev = new EventEmitter();
        const ws = new WebSocketClient(ev);

        ws.open("ws://localhost:" + RED.settings.redMobileWsPort + "/mobile/serial");
        ev.on("open",() => {
            node.status({fill: "blue",shape: "dot",text: "connect"});
        });
        ev.on("close", () => {
            node.status({fill: "green",shape: "dot",text: "close"});
        });
        ev.on("error", (e)=>{
            node.status({fill: "red",shape: "dot",text: "error"});
            node.send({payload:e});
        });
        ev.on("message" ,(data)=>{
            node.send({payload: JSON.parse(data)});
        });
    }

    RED.nodes.registerType("serial-read", RedMobileSerialReadNode);
};
