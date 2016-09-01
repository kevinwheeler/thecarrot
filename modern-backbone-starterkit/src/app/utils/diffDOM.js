import diffDOM from 'diff-dom';

const dd = new diffDOM({
  valueDiffing: false
});

// Everyone can share one instance, which is the reason for ths file.
export default dd;
