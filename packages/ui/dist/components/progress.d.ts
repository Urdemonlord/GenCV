import * as React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
}
declare const Progress: React.ForwardRefExoticComponent<ProgressProps & React.RefAttributes<HTMLDivElement>>;

export { Progress, type ProgressProps };
