import { useCallback, useRef, useEffect } from 'react';

interface UseHandleStreamResponseProps {
  onChunk: (chunk: string) => void;
  onFinish: (fullContent: string) => void;
}

function useHandleStreamResponse({
  onChunk,
  onFinish
}: UseHandleStreamResponseProps): (response: Response) => Promise<void> {
  const handleStreamResponse = useCallback(
    async (response: Response) => {
      if (response.body) {
        const reader = response.body.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let content = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              onFinish(content);
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            content += chunk;
            onChunk(content);
          }
        }
      }
    },
    [onChunk, onFinish]
  );

  const handleStreamResponseRef = useRef(handleStreamResponse);

  useEffect(() => {
    handleStreamResponseRef.current = handleStreamResponse;
  }, [handleStreamResponse]);

  return useCallback((response: Response) => handleStreamResponseRef.current(response), []);
}

export default useHandleStreamResponse;