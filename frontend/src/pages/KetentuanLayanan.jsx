import React from 'react';
import { Link } from 'react-router-dom';

const KetentuanLayanan = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link to="/" className="text-cyan-600 hover:text-cyan-700 text-sm">&larr; Kembali ke Beranda</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Ketentuan Layanan</h1>
          <p className="text-gray-500 mt-1">Terakhir diperbarui: 15 Februari 2026</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-10 space-y-8 text-gray-700 leading-relaxed">
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Pendahuluan</h2>
            <p>Selamat datang di Mawana Digital Services ("Kami", "Perusahaan"). Dengan mengakses dan menggunakan layanan kami melalui situs web mawanads.com ("Situs"), Anda ("Pengguna") menyetujui dan terikat oleh ketentuan layanan berikut ini. Harap baca ketentuan ini dengan seksama sebelum menggunakan layanan kami.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Layanan yang Disediakan</h2>
            <p>Mawana Digital Services menyediakan layanan berikut:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Jasa manajemen iklan digital (Meta Ads, Google Ads, TikTok Ads)</li>
              <li>Penyediaan akun whitelist untuk platform periklanan</li>
              <li>Konsultasi strategi digital marketing</li>
              <li>Penyelenggaraan webinar dan pelatihan online berbayar</li>
              <li>Layanan afiliasi dan referral marketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Pendaftaran dan Akun</h2>
            <p>Untuk menggunakan beberapa layanan kami, Anda mungkin diminta untuk memberikan informasi pribadi termasuk nama lengkap, alamat email, nomor WhatsApp, dan informasi bisnis. Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda dan memastikan semua informasi yang diberikan adalah akurat dan terkini.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Pembayaran dan Penagihan</h2>
            <p>Untuk layanan berbayar termasuk webinar dan pelatihan:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Semua harga yang tercantum dalam mata uang Rupiah (IDR) dan sudah termasuk pajak yang berlaku.</li>
              <li>Pembayaran diproses melalui gateway pembayaran pihak ketiga yang terpercaya (TriPay).</li>
              <li>Pembayaran harus diselesaikan sebelum batas waktu yang ditentukan pada invoice.</li>
              <li>Invoice yang tidak dibayar dalam batas waktu akan otomatis kedaluwarsa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Kebijakan Pembatalan dan Pengembalian Dana</h2>
            <p>Untuk webinar dan acara online:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Pembatalan yang diajukan lebih dari 3 hari sebelum acara akan mendapatkan pengembalian dana penuh.</li>
              <li>Pembatalan yang diajukan dalam 1-3 hari sebelum acara akan mendapatkan pengembalian dana 50%.</li>
              <li>Pembatalan pada hari pelaksanaan atau setelah acara tidak mendapatkan pengembalian dana.</li>
              <li>Jika acara dibatalkan oleh penyelenggara, peserta akan mendapatkan pengembalian dana penuh atau opsi untuk mengikuti jadwal pengganti.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Hak Kekayaan Intelektual</h2>
            <p>Semua konten yang disediakan dalam layanan kami, termasuk materi webinar, presentasi, dan dokumen pendukung, dilindungi oleh hak cipta. Pengguna tidak diperkenankan mendistribusikan, mereproduksi, atau menggunakan konten tersebut untuk keperluan komersial tanpa izin tertulis dari kami.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Batasan Tanggung Jawab</h2>
            <p>Kami berusaha memberikan layanan terbaik, namun tidak menjamin bahwa hasil yang dicapai akan sama untuk setiap pengguna. Hasil dari penerapan strategi yang diajarkan dapat bervariasi tergantung pada berbagai faktor. Kami tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan layanan kami.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Perubahan Ketentuan</h2>
            <p>Kami berhak mengubah ketentuan layanan ini sewaktu-waktu. Perubahan akan berlaku efektif setelah dipublikasikan di Situs. Penggunaan layanan yang berkelanjutan setelah perubahan dianggap sebagai persetujuan Anda terhadap ketentuan yang telah diperbarui.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Kontak</h2>
            <p>Jika Anda memiliki pertanyaan mengenai ketentuan layanan ini, silakan hubungi kami melalui:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Email: marissamarwahmadina@gmail.com</li>
              <li>WhatsApp: +62 896-5512-8024</li>
              <li>Website: mawanads.com</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default KetentuanLayanan;
