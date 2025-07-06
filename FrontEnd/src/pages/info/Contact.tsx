import Layout from '@/components/Layout';

export default function Contact() {
  return (
    <Layout>
      <div className="container mx-auto py-10 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Контакты</h1>
        <p className="text-lg text-slate-700 mb-4">
          Если у вас есть вопросы, предложения или требуется поддержка — свяжитесь с нами:
        </p>
        <ul className="mb-6 text-slate-700">
          <li className="mb-2">
            <span className="font-semibold">Email:</span>{' '}
            <a href="mailto:support@testwise.com" className="text-indigo-600 underline">support@testwise.com</a>
          </li>
          <li className="mb-2">
            <span className="font-semibold">Телефон:</span>{' '}
            <a href="tel:+79991234567" className="text-indigo-600 underline">+7 (999) 123-45-67</a>
          </li>
          <li>
            <span className="font-semibold">Адрес:</span> 123456, г. Санкт-Петербург, ул. Лоцманская д. 3
          </li>
        </ul>
        <p className="text-slate-500 text-sm">Мы работаем ежедневно с 9:00 до 18:00 (МСК).</p>
      </div>
    </Layout>
  );
} 