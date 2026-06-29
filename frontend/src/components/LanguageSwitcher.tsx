import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <Select
      size="small"
      value={i18n.language.startsWith('en') ? 'en' : 'zh'}
      onChange={(v) => i18n.changeLanguage(v)}
      style={{ width: 100 }}
      suffixIcon={<GlobalOutlined />}
      options={[
        { value: 'zh', label: t('languages.zh') },
        { value: 'en', label: t('languages.en') },
      ]}
      aria-label={t('app.language')}
    />
  );
}
