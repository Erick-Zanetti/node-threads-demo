import cluster from 'cluster';
import { cpus } from 'os';
import path from 'path';
import { performance } from 'perf_hooks';
import { Worker, isMainThread } from 'worker_threads';

const numCPUs = cpus().length;
const matrixSize = 500;

const generateMatrix = (size) => {
    const matrix = [];
    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
            matrix[i][j] = Math.floor(Math.random() * 10);
        }
    }
    return matrix;
};

const multiplyMatrices = (A, B) => {
    const result = [];
    for (let i = 0; i < A.length; i++) {
        result[i] = [];
        for (let j = 0; j < B[0].length; j++) {
            result[i][j] = 0;
            for (let k = 0; k < B.length; k++) {
                result[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return result;
};

const matrixA = generateMatrix(matrixSize);
const matrixB = generateMatrix(matrixSize);

// 1. Single-threaded Node.js
const singleThreadedMatrixMultiplication = () => {
    const start = performance.now();
    const result = multiplyMatrices(matrixA, matrixB);
    const end = performance.now();
    console.log("\nSingle-threaded matrix multiplication complete.");
    console.log(`Execution Time (Single-threaded): ${(end - start).toFixed(2)} ms`);
};

// 2. Using the Cluster API
const clusterMatrixMultiplication = () => {
    if (cluster.isPrimary) {
        const start = performance.now();
        let results = new Array(matrixSize).fill(null).map(() => new Array(matrixSize).fill(0));
        let workersCompleted = 0;
        
    
        for (let i = 0; i < numCPUs; i++) {
            const startRow = Math.floor(i * matrixSize / numCPUs);
            const endRow = Math.floor((i + 1) * matrixSize / numCPUs);
            
            const worker = cluster.fork();
            
            worker.on('message', (result) => {
                for (let row = startRow; row < endRow; row++) {
                    results[row] = result[row - startRow];
                }
                workersCompleted++;
                if (workersCompleted === numCPUs) {
                    const end = performance.now();
                    console.log("Cluster matrix multiplication complete.");
                    console.log(`Execution Time (Cluster): ${(end - start).toFixed(2)} ms`);
                }
            });
            
            worker.on('online', () => {
                worker.send({ matrixA, matrixB, startRow, endRow });
            });
        }
    } else {
        process.on('message', (msg) => {
            const { matrixA, matrixB, startRow, endRow } = msg;
            const partialResult = multiplyMatrices(matrixA.slice(startRow, endRow), matrixB);
            process.send(partialResult);
        });
    }
};

// 3. Using Worker Threads
const workerThreadsMatrixMultiplication = () => {
    if (isMainThread) {
        const start = performance.now();
        let results = new Array(matrixSize).fill(null).map(() => new Array(matrixSize).fill(0));
        let workersCompleted = 0;
        
    
        for (let i = 0; i < numCPUs; i++) {
            const startRow = Math.floor(i * matrixSize / numCPUs);
            const endRow = Math.floor((i + 1) * matrixSize / numCPUs);
            
            const worker = new Worker(path.resolve('./worker-thread-task.js'), {
                workerData: { matrixA, matrixB, startRow, endRow }
            });
            
            worker.on('message', (result) => {
                for (let row = startRow; row < endRow; row++) {
                    results[row] = result[row - startRow];
                }
                workersCompleted++;
                if (workersCompleted === numCPUs) {
                    const end = performance.now();
                    console.log("Worker Threads matrix multiplication complete.");
                    console.log(`Execution Time (Worker Threads): ${(end - start).toFixed(2)} ms`);
                }
            });
        }
    }
};

const mode = process.argv[2];

if (mode === 'single-threaded') {
    singleThreadedMatrixMultiplication();
} else if (mode === 'worker-threads') {
    workerThreadsMatrixMultiplication();
} else if (mode === 'cluster') {
    clusterMatrixMultiplication();
} else {
    console.log(`Usage: node ${process.argv[1]} <single-threaded|worker-threads|cluster>`);
}
