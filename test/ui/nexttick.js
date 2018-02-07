
function testNextTick1(next) {
       var res = []
       , resStart = Date.now()
       function addRes(num) {
               return res.push.bind(res, num)
       }
       addRes(1)()
       process.nextTick(function() {
               addRes(3)()
               process.nextTick(addRes(5))
               process.nextTick(addRes(6))
               addRes(4)()
               process.nextTick(function(){
                       if (""+res != "1,2,3,4,5,6") console.log("not ok - process.nextTick1 = " + res)
                       else console.log("ok - process.nextTick1", Date.now() - resStart)
               })
       })
       addRes(2)()
}

function testNextTick2() {
       var res = []
       , resStart = Date.now()
       function addRes(num) {
               return res.push.bind(res, num)
       }
       addRes(1)()
       setTimeout(function() {
               addRes(3)()
               setTimeout(addRes(5),0)
               setTimeout(addRes(6),0)
               addRes(4)()
               setTimeout(function(){
                       if (""+res != "1,2,3,4,5,6") console.log("not ok - process.nextTick2 = " + res)
                       else console.log("ok - process.nextTick2", Date.now() - resStart)
               },0)
       },0)
       addRes(2)()
}

function testNextTick3(next) {
       var res = []
       , resStart = Date.now()
       function addRes(num) {
               return res.push.bind(res, num)
       }
       addRes(1)()
       setImmediate(function() {
               addRes(3)()
               setImmediate(addRes(5))
               setImmediate(addRes(6))
               addRes(4)()
               setImmediate(function(){
                       if (""+res != "1,2,3,4,5,6") console.log("not ok - process.nextTick3 = " + res)
                       else console.log("ok - process.nextTick3", Date.now() - resStart)
               })
       })
       addRes(2)()
}

testNextTick1()
testNextTick2()
window.setImmediate && testNextTick3()


