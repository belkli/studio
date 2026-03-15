import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  logoContainer: ({ theme = 'a', showText = true, className, ...props }: {
    theme?: 'a' | 'b'
    showText?: boolean
    className?: string
  } & SVGProps<SVGSVGElement>) => {
    const containerStyles = {
      a: 'w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(239,84%,67%)]',
      b: 'w-[34px] h-[34px] rounded-lg bg-gradient-to-br from-brand-gold to-brand-gold-light',
    }
    const textStyles = {
      a: { base: 'font-heading text-xl font-extrabold text-primary', accent: 'text-[hsl(234,90%,74%)]' },
      b: { base: 'font-display text-[22px] font-bold italic text-foreground', accent: 'text-brand-gold' },
    }
    const s = theme === 'b' ? 'b' : 'a'
    return (
      <span className={cn('flex items-center gap-2', className)}>
        <span className={cn(containerStyles[s], 'flex items-center justify-center shrink-0')}>
          <Icons.logo className={cn(s === 'a' ? 'h-[18px] w-[18px] text-white' : 'h-4 w-4 text-[hsl(210,50%,11%)]')} {...props} />
        </span>
        {showText && (
          <span className={textStyles[s].base}>
            Lyri<span className={textStyles[s].accent}>o</span>sa
          </span>
        )}
      </span>
    )
  },
  google: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.84,44,30.338,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
  ),
  microsoft: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <path fill="#F25022" d="M1 1h10v10H1z"></path><path fill="#7FBA00" d="M13 1h10v10H13z"></path><path fill="#00A4EF" d="M1 13h10v10H1z"></path><path fill="#FFB900" d="M13 13h10v10H13z"></path>
    </svg>
  ),
  help: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
};
