'use strict';

const app = new Vue({
    el: '#app',
    data: {
        rank: 3,
        newRank: 3,
        maxRank: 6,
        minRank: 2,
        sideCount: 6,
        matrixCube: {},
        matrix: [],
        matrixBackup: [],
        matrixSum: 0,
        matrixSumBackup: 0,
        historyUndo: [],
        historyRedo: [],
        win: false,
        cellCount: 0,
        score: 0,
        visibleScore: 0,

        fieldWidth: 500,
        fieldHeight: 500,

        scene: new THREE.Scene(),
        camera: {},
        cameraDistance: 30,
        baseSize: 25,
        thickness: 0.4,
        gap:0.75
    },
    methods: {
        increaseRank() {
            this.newRank = Math.min(this.newRank + 1, this.maxRank);
        },
        decreaseRank() {
            this.newRank = Math.max(this.newRank - 1, this.minRank);
        },
        traceClick (e) {
            let tempX = e.offsetX;
            let tempY = e.offsetY;

            let finishClick = (e) => {
                if (tempX === e.offsetX && tempY === e.offsetY) {
                    let raycaster = new THREE.Raycaster();
                    let mouse = new THREE.Vector2((e.offsetX / this.fieldWidth) * 2 - 1, -(e.offsetY / this.fieldHeight) * 2 + 1);
                    raycaster.setFromCamera(mouse, this.camera);
                    let result = raycaster.intersectObjects(this.scene.children);
                    if (result.length > 0 && result[0].object.name !== 'cube') {
                        result = result[0].object;
                        this.touch(result.coordinate);
                    } else {
                    }
                }
                document.removeEventListener('mouseup', finishClick);
            }
            document.addEventListener('mouseup', finishClick);

        },
        touch (coordinate) {
            if (!this.win) {
                this.historyUndo.push(coordinate);
                this.historyRedo = [];
                this.changeState(coordinate);
                this.checkWin();
            }
        },
        checkWin () {
            if ((this.matrixSum === this.cellCount || this.matrixSum === 0) && !this.win) {
                this.doWin();
            }
        },
        doWin () {
            this.score += this.cellCount * this.cellCount;
            TweenLite.to(this, 1.5, { visibleScore: this.score, onUpdate: () => { this.visibleScore = Math.round(this.visibleScore) }, ease: Power2.easeOut });
            this.win = true;
            this.animateWin();
        },
        undoWin () {
            this.score -= this.cellCount * this.cellCount;
            TweenLite.to(this, 1.5, { visibleScore: this.score, onUpdate: () => { this.visibleScore = Math.round(this.visibleScore) }, ease: Power2.easeOut });
            this.win = false;
            this.deanimateWin();
        },
        animateWin() {
            TweenLite.to(this.matrixCube.material.color, 0.45, {
                r: 255/255,
                g: 195/255,
                b: 28/255,
                ease: Power2.easeIn,
                overwrite: 5
            });
            for (let sideIndex = 0; sideIndex < 6; sideIndex++) {
                for (let rowIndex = 0, r = this.rank; rowIndex < r; rowIndex++) {
                    for (let cellIndex = 0; cellIndex < r; cellIndex++) {
                        TweenLite.to(
                            this.matrix[sideIndex][rowIndex][cellIndex].material.color,
                            0.5,
                            {
                                r: 170 / 255,
                                g: 153 / 255,
                                b: 170 / 255,
                                ease: Power2.easeInOut,
                                delay: Math.abs(rowIndex - (this.rank - 1) / 2) / 10 + Math.abs(cellIndex - (this.rank - 1) / 2) / 10,
                                overwrite: 5
                            }
                        );
                    }
                }
            }
        },
        deanimateWin() {
            TweenLite.to(this.matrixCube.material.color, 0.45, {
                r: 170/255,
                g: 153/255,
                b: 170/255,
                ease: Power2.easeIn,
                overwrite: 5
            });
            for (let sideIndex = 0; sideIndex < 6; sideIndex++) {
                for (let rowIndex = 0, r = this.rank; rowIndex < r; rowIndex++) {
                    for (let cellIndex = 0; cellIndex < r; cellIndex++) {
                        let cell = this.matrix[sideIndex][rowIndex][cellIndex];
                        if (cell.inverted) {
                            TweenLite.to(cell.material.color, 0.45, {
                                r: 64/255,
                                g: 51/255,
                                b: 64/255,
                                ease: Power2.easeIn,
                                overwrite: 5
                            });
                        } else {
                            TweenLite.to(cell.material.color, 0.45, {
                                r: 221/255,
                                g: 221/255,
                                b: 238/255,
                                ease: Power2.easeIn,
                                overwrite: 5
                            });
                        }
                    }
                }
            }
        },
        changeState (coordinate) {
            this.invert(coordinate);
            this.findNeighbors(coordinate).forEach((neighborCoordinate) => {
                this.invert(neighborCoordinate);
            });
        },
        changeStateInstant (coordinate) {
            this.invertInstant(coordinate);
            this.findNeighbors(coordinate).forEach((neighborCoordinate) => {
                this.invertInstant(neighborCoordinate);
            });
        },
        undo() {
            if (this.historyUndo.length > 0) {
                let coordinate = this.historyUndo.pop();
                this.changeState(coordinate);
                this.historyRedo.push(coordinate);
                if (this.win) {
                    this.undoWin();
                }
            }
        },
        redo() {
            if (this.historyRedo.length > 0) {
                let coordinate = this.historyRedo.pop();
                this.changeState(coordinate);
                this.historyUndo.push(coordinate);
                this.checkWin();
            }
        },
        findNeighbors(coordinate) {
            return [
                this.findBottomNeighbor(coordinate),
                this.findTopNeighbor(coordinate),
                this.findLeftNeighbor(coordinate),
                this.findRightNeighbor(coordinate)
            ];
        },
        findBottomNeighbor(coordinate) {
            if (coordinate[1] > 0) {
                return [coordinate[0], coordinate[1] - 1, coordinate[2]];
            }
            switch (coordinate[0]) {
                case 0: {
                    return [1, this.rank - 1, coordinate[2]];
                }
                case 1: {
                    return [5, 0, coordinate[2]];
                }
                case 2: {
                    return [1, coordinate[2], 0];
                }
                case 3: {
                    return [1, coordinate[2], this.rank - 1];
                }
                case 4: {
                    return [5, this.rank - 1, coordinate[2]];
                }
                case 5: {
                    return [1, 0, coordinate[2]];
                }

            }
        },
        findTopNeighbor (coordinate) {
            if (coordinate[1] < (this.rank - 1)) {
                return [coordinate[0], coordinate[1] + 1, coordinate[2]];
            }
            switch (coordinate[0]) {
                case 0: {
                    return [4, this.rank - 1, coordinate[2]];
                }
                case 1: {
                    return [0, 0, coordinate[2]];
                }
                case 2: {
                    return [4, coordinate[2], 0];
                }
                case 3: {
                    return [4, coordinate[2], this.rank - 1];
                }
                case 4: {
                    return [0, this.rank - 1, coordinate[2]];
                }
                case 5: {
                    return [4, 0, coordinate[2]];
                }

            }
        },
        findLeftNeighbor (coordinate) {
            if (coordinate[2] < this.rank - 1) {
                return [coordinate[0], coordinate[1], coordinate[2] + 1];
            }
            switch (coordinate[0]) {
                case 0: {
                    return [3, coordinate[1], this.rank - 1];
                }
                case 1: {
                    return [3, 0, coordinate[1]];
                }
                case 2: {
                    return [0, coordinate[1], this.rank - 1 - coordinate[2]];
                }
                case 3: {
                    return [0, coordinate[1], this.rank - 1];
                }
                case 4: {
                    return [3, this.rank - 1, coordinate[1]];
                }
                case 5: {
                    return [3, coordinate[1], 0];
                }

            }
        },
        findRightNeighbor (coordinate) {
            if (coordinate[2] > 0) {
                return [coordinate[0], coordinate[1], coordinate[2] - 1];
            }
            switch (coordinate[0]) {
                case 0: {
                    return [2, coordinate[1], this.rank - 1];
                }
                case 1: {
                    return [2, 0, coordinate[1]];
                }
                case 2: {
                    return [5, coordinate[1], 0];
                }
                case 3: {
                    return [5, coordinate[1], this.rank - 1];
                }
                case 4: {
                    return [2, this.rank - 1, coordinate[1]];
                }
                case 5: {
                    return [2, coordinate[1], 0];
                }

            }
        },
        invert (coordinate) {
            let cell = this.matrix[coordinate[0]][coordinate[1]][coordinate[2]];
            if (cell.inverted) {
                this.matrixSum--;
                TweenLite.to(cell.material.color, 0.45, {
                    r: 0.87,
                    g: 0.85,
                    b: 0.95,
                    ease: Power2.easeIn,
                    overwrite: 5
                });
            } else {
                this.matrixSum++;
                TweenLite.to(cell.material.color, 0.45, {
                    r: 0.25,
                    g: 0.2,
                    b: 0.25,
                    ease: Power2.easeIn,
                    overwrite: 5
                });
            }

            cell.inverted = !cell.inverted;

            TweenLite.to(cell.scale, 0.3, {
                x: 0.5,
                y: 0.5,
                z: 0.5,
                ease: Power2.easeOutIn,
                onComplete: () => {
                    TweenLite.to(cell.scale, 0.3, {
                        x: 1,
                        y: 1,
                        z: 1,
                        ease: Power2.easeOutIn,
                        overwrite: 5
                    })
                }
            });
        },
        invertInstant (coordinate) {
            let cell = this.matrix[coordinate[0]][coordinate[1]][coordinate[2]];
            if (cell.inverted) {
                this.matrixSum--;
                cell.material.color.r = 0.87;
                cell.material.color.g = 0.85;
                cell.material.color.b = 0.95;
            } else {
                this.matrixSum++;
                cell.material.color.r = 0.25;
                cell.material.color.g = 0.2;
                cell.material.color.b = 0.25;
            }

            cell.inverted = !cell.inverted;
        },
        clearScene() {
            for (let sideIndex = 0; sideIndex < 6; sideIndex++) {
                for (let rowIndex = 0, r = this.rank; rowIndex < r; rowIndex++) {
                    for (let cellIndex = 0; cellIndex < r; cellIndex++) {
                        TweenLite.to(
                            this.matrix[sideIndex][rowIndex][cellIndex].scale,
                            0.5,
                            {
                                x: 0.001,
                                y: 0.001,
                                z: 0.001,
                                ease: Power2.easeInOut,
                                delay: Math.abs(rowIndex - (this.rank - 1) / 2) / 10 + Math.abs(cellIndex - (this.rank - 1) / 2) / 10,
                                overwrite: 5
                            }
                        );
                    }
                }
            }
        },
        createBackup() {
            this.matrixBackup = this.matrix.map((side) => side.map((row) => row.map((cell, cellIndex) => row[cellIndex].inverted)));
            this.matrixSumBackup = this.matrixSum;
        },
        reset () {
            this.historyUndo = [];
            this.historyRedo = [];
            if (this.win) {
                this.undoWin();
            }

            for (let sideIndex = 0, s = this.sideCount; sideIndex < s; sideIndex++) {
                for (let rowIndex = 0, r = this.rank; rowIndex < r; rowIndex++) {
                    for (let cellIndex = 0; cellIndex < r; cellIndex++) {
                        let cell = this.matrix[sideIndex][rowIndex][cellIndex];
                        if (cell.inverted !== this.matrixBackup[sideIndex][rowIndex][cellIndex]) {
                            this.invert([sideIndex, rowIndex, cellIndex]);
                        }
                    }
                }
            }
            this.matrixSum = this.matrixSumBackup;
            //this.clearScene();
            //setTimeout(() => {
            //    for (let sideIndex = 0, s = this.sideCount; sideIndex < s; sideIndex++) {
            //        for (let rowIndex = 0, r = this.rank; rowIndex < r; rowIndex++) {
            //            for (let cellIndex = 0; cellIndex < r; cellIndex++) {
            //                let cell = this.matrix[sideIndex][rowIndex][cellIndex];
            //                cell.inverted = this.matrixBackup[sideIndex][rowIndex][cellIndex];
            //                TweenLite.to(
            //                    cell.scale,
            //                    0.5,
            //                    {
            //                        x: 1,
            //                        y: 1,
            //                        z: 1,
            //                        ease: Power2.easeInOut,
            //                        delay: 0.5 - Math.abs(rowIndex - (this.rank - 1) / 2) / 10 - Math.abs(cellIndex - (this.rank - 1) / 2) / 10
            //                    }
            //                );
            //            }
            //        }
            //    }
            //    this.matrixSum = this.matrixSumBackup;
            //}, (0.5 + (Math.abs((this.rank - 1) - (this.rank - 1) / 2) / 10 + Math.abs((this.rank - 1) - (this.rank - 1) / 2) / 10)) * 1000);
        },
        generate () {
            while (this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }

            this.rank = this.newRank;
            this.matrix = [];
            this.matrixSum = 0;
            this.historyUndo = [];
            this.historyRedo = [];
            this.cellCount = this.sideCount * this.rank * this.rank;

            this.matrixCube = new THREE.Mesh(new THREE.BoxGeometry(this.baseSize, this.baseSize, this.baseSize), new THREE.MeshBasicMaterial({ wireframe: false, color: 0xaa99aa }));
            this.matrixCube.name = 'cube';
            this.scene.add(this.matrixCube);


            for (let sideIndex = 0; sideIndex < this.sideCount; sideIndex++) {
                let side = [];

                for (let rowIndex = 0, r = this.rank; rowIndex < r; rowIndex++) {
                    let row = [];
                    for (let cellIndex = 0; cellIndex < r; cellIndex++) {
                        let wireframe = false;
                        let size = (this.baseSize - (r) * this.gap) / r;
                        let step = size + this.gap;
                        let baseoffset = (size - this.baseSize) / 2 + this.gap / 2;
                        let cell = {};
                        let color = 0xddddee;
                        switch (sideIndex) {
                            case 0: {
                                cell = new THREE.Mesh(new THREE.BoxGeometry(size, size, this.thickness), new THREE.MeshBasicMaterial({ wireframe: wireframe, color: color }));
                                cell.position.x = cellIndex * step + baseoffset;
                                cell.position.y = rowIndex * step + baseoffset;
                                cell.position.z = this.baseSize / 2;
                                break;
                            }
                            case 1: {
                                cell = new THREE.Mesh(new THREE.BoxGeometry(size, this.thickness, size), new THREE.MeshBasicMaterial({ wireframe: wireframe, color: color }));
                                cell.position.x = cellIndex * step + baseoffset;
                                cell.position.y = -this.baseSize / 2;
                                cell.position.z = rowIndex * step + baseoffset;
                                break;
                            }
                            case 2: {
                                cell = new THREE.Mesh(new THREE.BoxGeometry(this.thickness, size, size), new THREE.MeshBasicMaterial({ wireframe: wireframe, color: color }));
                                cell.position.x = -this.baseSize / 2;
                                cell.position.y = rowIndex * step + baseoffset;
                                cell.position.z = cellIndex * step + baseoffset;
                                break;
                            }
                            case 3: {
                                cell = new THREE.Mesh(new THREE.BoxGeometry(this.thickness, size, size), new THREE.MeshBasicMaterial({ wireframe: wireframe, color: color }));
                                cell.position.x = this.baseSize / 2;
                                cell.position.y = rowIndex * step + baseoffset;
                                cell.position.z = cellIndex * step + baseoffset;
                                break;
                            }
                            case 4: {
                                cell = new THREE.Mesh(new THREE.BoxGeometry(size, this.thickness, size), new THREE.MeshBasicMaterial({ wireframe: wireframe, color: color }));
                                cell.position.x = cellIndex * step + baseoffset;
                                cell.position.y = this.baseSize / 2;
                                cell.position.z = rowIndex * step + baseoffset;
                                break;
                            }
                            case 5: {
                                cell = new THREE.Mesh(new THREE.BoxGeometry(size, size, this.thickness), new THREE.MeshBasicMaterial({ wireframe: wireframe, color: color }));
                                cell.position.x = cellIndex * step + baseoffset;
                                cell.position.y = rowIndex * step + baseoffset;
                                cell.position.z = -this.baseSize / 2;
                                break;
                            }
                        }

                        cell.inverted = false;
                        cell.coordinate = [sideIndex, rowIndex, cellIndex];
                        this.scene.add(cell);
                        row.push(cell);
                        cell.scale.x = 0.001;
                        cell.scale.y = 0.001;
                        cell.scale.z = 0.001;

                        TweenLite.to(
                            cell.scale,
                            0.5,
                            {
                                x: 1,
                                y: 1,
                                z: 1,
                                ease: Power2.easeInOut,
                                delay: 0.5 - Math.abs(rowIndex - (this.rank - 1) / 2) / 10 - Math.abs(cellIndex - (this.rank - 1) / 2) / 10,
                                overwrite: 5
                            }
                        );
                    }
                    side.push(row);
                }
                this.matrix.push(side);
            }

            let getRandomCoordinate = () =>[Math.round(Math.random() * (this.sideCount - 1)), Math.round(Math.random() * (this.rank - 1)), Math.round(Math.random() * (this.rank - 1))]; //side, row, cell
            let lastCoordinate = getRandomCoordinate();
            for (let i = 0, d = this.rank * this.rank; i < d; i++) {
                let coordinate = getRandomCoordinate();
                if (coordinate === lastCoordinate) {
                    i--;
                } else {
                    this.changeStateInstant(coordinate);
                    lastCoordinate = coordinate;
                }
            }
            this.createBackup();
        },
        pregenerate () {
            if (this.matrix.length !== 0) {

                if (this.win) {
                    this.win = false;
                    this.deanimateWin();
                }
                this.clearScene();
                setTimeout(() => {
                    this.generate();
                }, (0.5 + (Math.abs((this.rank - 1) - (this.rank - 1) / 2) / 10 + Math.abs((this.rank - 1) - (this.rank - 1) / 2) / 10)) * 1000);
            } else {
                this.generate();
            }
        },
        initcanvas () {
            let element = document.getElementById('game-field');
            this.camera = new THREE.PerspectiveCamera(60, this.fieldWidth / this.fieldHeight, 0.1, 1000);
            let renderer = new THREE.WebGLRenderer({ antialias: true, canvas: element });
            renderer.setSize(this.fieldWidth, this.fieldHeight);
            this.camera.position.z = this.cameraDistance;
            this.camera.position.y = this.cameraDistance;
            this.camera.position.x = -this.cameraDistance;

            //this.scene.fog = new THREE.Fog(0xaa99aa, 40, 65);

            this.scene.background = new THREE.Color(0xaa99aa);
            var controls = new THREE.OrbitControls(this.camera);
            this.pregenerate();

            let animate = () => {
                requestAnimationFrame(animate);
                renderer.render(this.scene, this.camera);
            }
            animate();

            element.addEventListener('mousedown', this.traceClick);
        }
    },
    created: function () {
        this.initcanvas();
    }
});
