
Optomizer = function () {

    this.getScore = function (paths) {

        totalDistance = 0

        plotterPos = [0, 0]

        function moveTo(p) {
            dx = Math.round(p[0] - plotterPos[0])
            dy = Math.round(p[1] - plotterPos[1])
            totalDistance += Math.sqrt(dx * dx + dy * dy)
            plotterPos = p
        }

        paths.forEach(path => {

            moveTo(path[0])
            for (var i = 1; i < path.length; i++) {
                moveTo(path[i])
            }
        })
        moveTo([0, 0])

        return totalDistance
    }

    this.optomize = function (paths) {

        paths = paths.filter(p => p.length > 0)

        score = this.getScore(paths)
        console.log(score)

        var distance = function(a, b){
            return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
          }
          
        pointsStart = paths.map((p, idx) => ({x:p[0][0], y:p[0][1], i:idx}))
        pointsStart.shift()

        // pointsEnd = paths.map((p, idx) => ({x:p[p.length-1][0], y:p[p.length-1][1], i:idx}))
        // pointsEnd.shift()
        
        console.log(pointsStart)

        var treeStarts = new kdTree(pointsStart, distance, ["x", "y"]);
        // var treeEnds = new kdTree(pointsEnd, distance, ["x", "y"]);

        reorderedPaths = [paths[0]]

        pathsConsumed = 1
        
        while (pathsConsumed < paths.length) {
        // while (pathsConsumed < 10) {
            
            console.log(pathsConsumed, paths.length)
            thisPath = reorderedPaths[reorderedPaths.length - 1]

            console.log(thisPath)
            endOfPath = {
                x:thisPath[thisPath.length - 1][0], 
                y:thisPath[thisPath.length - 1][1]
            }

            closestStart = treeStarts.nearest(endOfPath, 1)[0]

            // closestEnd = treeEnds.nearest(endOfPath, 2)
            // closestEnd.sort((a,b) => a[1] - b[1])
            // closestEnd = closestEnd[1]
            distance = closestStart[1]
            console.log(distance )
            console.log(closestStart[0])
            treeStarts.remove(closestStart[0])

            bestIndex = closestStart[0].i
            console.log("estindex", bestIndex)
            bestPath = paths[bestIndex]

            // if ( closestEnd < closestStart) {
                // bestPath = paths[i].reverse()
            // }

            if (distance < 0.0001) {
                reorderedPaths[reorderedPaths.length - 1] = thisPath.concat(bestPath.slice(1))

            } else {
                reorderedPaths.push(bestPath)
            }

            pathsConsumed ++;
            // paths.splice(bestPathIdx, 1)
        }

        newScore = this.getScore(reorderedPaths)
        console.log(newScore)



        return reorderedPaths
    }

};