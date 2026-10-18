import { useState } from "react";
import {
  SocialButton,
  type SocialProvider,
} from "@libs/react-shared/ui/social-button";
import { cn } from "@libs/ui/utils/cn";
import { authClientReact } from "@libs/auth/authClient";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { useAuthCapabilities } from '@/hooks/use-auth-capabilities';
import { useAuthReturnTo } from '@/lib/auth-navigation';
import { authCopy } from '@/lib/auth-copy';

interface SocialAuthProps extends React.HTMLAttributes<HTMLDivElement> {
  providers?: SocialProvider[];
}

export function SocialAuth({
  className,
  providers,
  ...props
}: SocialAuthProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { socialProviders } = useAuthCapabilities();
  const enabledProviders = providers ? providers.filter((provider) => socialProviders.includes(provider)) : socialProviders;
  const returnTo = useAuthReturnTo();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(
    null
  );

  const handleProviderClick = async (provider: SocialProvider) => {
    if (loadingProvider) return;

    switch (provider) {
      case "wechat":
        navigate({
          to: "/wechat",
          search: returnTo ? { returnTo } : undefined,
        });
        break;
      case "phone":
        navigate({
          to: "/cellphone",
          search: returnTo ? { returnTo } : undefined,
        });
        break;
      default:
        setLoadingProvider(provider);

        try {
          const callbackURL = returnTo
            ? `${window.location.origin}${returnTo}`
            : `${window.location.origin}/`;
          const { data, error } = await authClientReact.signIn.social({
            provider,
            ...(callbackURL && { callbackURL }),
          });

          if (error) {
            console.error("Social login error:", error);
            toast.error(error.message || t.common.unexpectedError);
          }
        } catch {
          toast.error(authCopy.requestFailed);
        } finally {
          setLoadingProvider(null);
        }
    }
  };

  if (!enabledProviders.length) return null;

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)} {...props}>
      {enabledProviders.map((provider) => (
        <SocialButton
          key={provider}
          provider={provider}
          onClick={() => handleProviderClick(provider)}
          loading={loadingProvider === provider}
          disabled={loadingProvider !== null && loadingProvider !== provider}
        />
      ))}
    </div>
  );
}
