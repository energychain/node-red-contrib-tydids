module.exports = function(RED) {
    function jwtResolverNode(config) {
       const TydidsP2P = require("tydids-p2p");

        RED.nodes.createNode(this,config);
        const node = this;
        const storage = node.context();

        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:'processing'});
            if(typeof msg.payload == 'string') {
              msg.payload = { jwt: msg.payload };
            }
            let ssi = await TydidsP2P.ssi(null,true);
            try {
              const resolution = await ssi.resolveDID(msg.payload.jwt);
              node.status({fill:'green',shape:"dot",text:'success'});
              node.send([{payload:resolution.payload},{payload:resolution}]);
            } catch(e) {
              node.status({fill:'red',shape:"dot",text:'failed'});
            }


        });
    }
    RED.nodes.registerType("Tydids-JWTPresentation",jwtResolverNode);
}
