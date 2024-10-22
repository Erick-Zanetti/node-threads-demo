import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

const fibonacci = (n) => (n <= 1 ? 1 : fibonacci(n - 1) + fibonacci(n - 2));

if (isMainThread) {
  console.log('Main thread running');

  const worker = new Worker(new URL(import.meta.url), {
    workerData: { num: 40 }
  });

  worker.on('message', (result) => {
    console.log(`Fibonacci result: ${result}`);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

} else {
  const result = fibonacci(workerData.num);
  parentPort.postMessage(result);
}