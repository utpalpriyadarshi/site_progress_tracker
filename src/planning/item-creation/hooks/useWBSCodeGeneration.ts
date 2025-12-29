import { useState, useEffect } from 'react';
import { WBSCodeGenerator } from '../../../../services/planning/WBSCodeGenerator';
import { logger } from '../../../services/LoggingService';

interface UseWBSCodeGenerationProps {
  siteId: string;
  parentWbsCode: string | null;
  onError: (message: string) => void;
}

export const useWBSCodeGeneration = ({
  siteId,
  parentWbsCode,
  onError,
}: UseWBSCodeGenerationProps) => {
  const [generatedWbsCode, setGeneratedWbsCode] = useState<string>('');
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    const generateCode = async () => {
      if (!siteId) return;

      setGeneratingCode(true);
      try {
        let code: string;

        if (parentWbsCode) {
          // Generate child code (static method)
          code = await WBSCodeGenerator.generateChildCode(siteId, parentWbsCode);
        } else {
          // Generate root code (static method)
          code = await WBSCodeGenerator.generateRootCode(siteId);
        }

        setGeneratedWbsCode(code);
      } catch (error) {
        logger.error('[ItemCreation] Error generating WBS code', error as Error);
        onError('Failed to generate WBS code');
      } finally {
        setGeneratingCode(false);
      }
    };

    generateCode();
  }, [siteId, parentWbsCode, onError]);

  return {
    generatedWbsCode,
    generatingCode,
  };
};
