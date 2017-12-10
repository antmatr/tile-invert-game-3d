
'use strict';
const app = new Vue({
    el: '#app',
    data: {
        matrix: [],
        matrixBackup: [],
        rank: 2,
        newRank: 2,
        minRank: 2,
        maxRank: 5,
        sideCount: 6,
        volume: 0,
        score: 0,
        baseCellState: 0,
        matrixSum: 0,
        matrixSumBackup: 0,
        win: false,
        startX: 0,
        startY: 0,
        rotationX: 225,
        rotationY: 140,
        deltaX: 225,
        deltaY: 140,
        cubeTransform: 'translate(-50%, -50%) rotateX(140deg) rotateY(225deg)',
        pressed: false
    },
    methods: {
        generate: function () {
            this.matrix = [];
            this.matrixBackup = [];
            this.rank = this.newRank;
            this.volume = this.rank * this.rank * this.sideCount;
            this.win = false;
            this.baseCellState = Math.round(Math.random());
            this.matrixSum = this.baseCellState * this.volume;

            for (let sideIndex = 0, s = this.sideCount; sideIndex < s; sideIndex++) {
                let side = [];
                for (let rowIndex = 0, r = this.rank; rowIndex < r; rowIndex++) {
                    let row = [];
                    for (let cellIndex = 0; cellIndex < r; cellIndex++) {
                        row.push(this.baseCellState);
                    }
                    side.push(row);
                }
                this.matrix.push(side);
            }

            setTimeout(() => {
                let getRandomCoordinate = () => [Math.round(Math.random() * (this.sideCount - 1)), Math.round(Math.random() * (this.rank - 1)), Math.round(Math.random() * (this.rank - 1))]; //side, row, cell
                let lastCoordinate = getRandomCoordinate();
                for (let i = 0, d = this.rank * this.rank; i < d; i++) {
                    let coordinate = getRandomCoordinate();
                    if (coordinate === lastCoordinate) {
                        i--;
                    } else {
                        this.changeState(coordinate);
                        lastCoordinate = coordinate;
                    }
                }
                this.createBackup();

            }, 500);

        },
        increaseRank () {
            this.newRank = Math.min(this.maxRank, this.newRank + 1);
        },
        decreaseRank () {
            this.newRank = Math.max(this.minRank, this.newRank - 1);
        },
        createBackup() {
            this.matrixBackup = this.matrix.map((side) => side.map((row) => row.map((cell, cellIndex) => row[cellIndex])));
            this.matrixSumBackup = this.matrixSum;
        },
        reset () {
            if (this.win === true) {
                this.score -= this.volume * this.volume;    //TODO: отделить логику начисления очков
                this.win = false;
            }
            for (let sideIndex = 0, s = this.sideCount; sideIndex < s; sideIndex++) {
                for (let rowIndex = 0, r = this.rank; rowIndex < r; rowIndex++) {
                    for (let cellIndex = 0; cellIndex < r; cellIndex++) {
                        Vue.set(this.matrix[sideIndex][rowIndex], cellIndex, this.matrixBackup[sideIndex][rowIndex][cellIndex]);
                    }
                }
            }
            this.matrixSum = this.matrixSumBackup;
        },
        invert (coordinate) {
            if (this.matrix[coordinate[0]][coordinate[1]][coordinate[2]] === 0) {
                Vue.set(this.matrix[coordinate[0]][coordinate[1]], coordinate[2], 1);
                this.matrixSum++;
            } else {
                Vue.set(this.matrix[coordinate[0]][coordinate[1]], coordinate[2], 0);
                this.matrixSum--;
            }
        },
        checkWin () {
            if ((this.matrixSum === this.volume || this.matrixSum === 0) && this.win !== true) {
                this.score += this.volume * this.volume;
                this.win = true;
            }
        },
        touch (coordinate) {
            if (this.win !== true && this.pressed === true) {
                this.changeState(coordinate);
                this.checkWin();
            }
            this.pressed = false;
        },
        changeState (coordinate) {
            this.invert(coordinate);
            this.findNeighbors(coordinate).forEach((neighborCoordinate) => {
                this.invert(neighborCoordinate);
            });
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
                    return [5, 0, this.rank - 1 - coordinate[2]];
                }
                case 2: {
                    return [1, this.rank - 1 - coordinate[2], this.rank - 1];
                }
                case 3: {
                    return [1, coordinate[2], 0];
                }
                case 4: {
                    return [0, this.rank - 1, coordinate[2]];
                }
                case 5: {
                    return [1, 0, this.rank - 1 - coordinate[2]];
                }

            }
        },
        findTopNeighbor (coordinate) {
            if (coordinate[1] < (this.rank - 1)) {
                return [coordinate[0], coordinate[1] + 1, coordinate[2]];
            }
            switch (coordinate[0]) {
                case 0: {
                    return [4, 0, coordinate[2]];
                }
                case 1: {
                    return [0, 0, coordinate[2]];
                }
                case 2: {
                    return [4, coordinate[2], this.rank - 1];
                }
                case 3: {
                    return [4, this.rank - 1 - coordinate[2], 0];
                }
                case 4: {
                    return [5, this.rank - 1, this.rank - 1 - coordinate[2]];
                }
                case 5: {
                    return [4, this.rank - 1, this.rank - 1 - coordinate[2]];
                }

            }
        },
        findLeftNeighbor (coordinate) {
            if (coordinate[2] < this.rank - 1) {
                return [coordinate[0], coordinate[1], coordinate[2] + 1];
            }
            switch (coordinate[0]) {
                case 0: {
                    return [2, coordinate[1], 0];
                }
                case 1: {
                    return [2, 0, this.rank - 1 - coordinate[1]];
                }
                case 2: {
                    return [5, coordinate[1], this.rank - 1 - coordinate[2]];
                }
                case 3: {
                    return [0, coordinate[1], 0];
                }
                case 4: {
                    return [2, this.rank - 1, coordinate[1]];
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
                    return [3, coordinate[1], this.rank - 1];
                }
                case 1: {
                    return [3, 0, coordinate[1]];
                }
                case 2: {
                    return [0, coordinate[1], this.rank - 1];
                }
                case 3: {
                    return [5, coordinate[1], this.rank - 1];
                }
                case 4: {
                    return [3, this.rank - 1, this.rank - 1 - coordinate[1]];
                }
                case 5: {
                    return [2, coordinate[1], this.rank - 1];
                }

            }
        },
        rotate (e) {
            if (this.pressed) {
                this.pressed = false;
            }
            this.deltaX = Math.round((this.startX - e.pageX)/2) + this.rotationX;
            this.deltaY = Math.max(130, Math.min(230, Math.round((this.startY - e.pageY)/2) + this.rotationY));
            this.cubeTransform = 'translate(-50%, -50%) rotateX(' + this.deltaY + 'deg) rotateY(' + this.deltaX + 'deg)';
        }
    },
    created: function () {
        this.generate();
        document.addEventListener('mousedown', (e) => {
            this.pressed = true;
            this.startX = e.pageX;
            this.startY = e.pageY;
            document.addEventListener('mousemove', this.rotate);
        });
        document.addEventListener('mouseup', () => {
            this.rotationX = this.deltaX;
            this.rotationY = this.deltaY;
            document.removeEventListener('mousemove', this.rotate);
        });
    }
});
