var assert = require('assert');
const helper = require("node-red-node-test-helper");

describe('Core', function() {
   beforeEach((done) => {
       helper.startServer(done);
   });

   before(() => {
    helper.init(require.resolve('node-red'));
   });

   afterEach((done) => {
       helper.unload().then(() => {
           helper.stopServer(done);
       });
   })

   const flow = require("./testflow.json");


  function runLocalN2NTest(done) {
       helper.load([], flow, () => {
             const inputNode = helper.getNode(inputNodeIds[0]);
             const outputNode = helper.getNode(outputNodeIds[0]);

             outputNode.on("input", (msg) => {
                 try {
                    console.log(msg);
                     expect(msg.payload).to.equal("payload contains 0")
                     done();
                 } catch (e) {
                     done(e);
                 }
             });

             inputNode.wires[0].forEach((wire) => {
                 const node = helper.getNode(wire);
                 node.receive({ payload: 123450 });
             })
         });
    }

    it("Caution! Requires more than 20 seconds!", (done) => {
            runLocalN2NTest(done);
    });
});
