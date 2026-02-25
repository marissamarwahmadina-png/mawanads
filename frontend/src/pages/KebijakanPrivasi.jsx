import React from 'react';
import { Link } from 'react-router-dom';

const KebijakanPrivasi = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link to="/" className="text-cyan-600 hover:text-cyan-700 text-sm">&larr; Kembali ke Beranda</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Kebijakan Privasi</h1>
          <p className="text-gray-500 mt-1">Terakhir diperbarui: 15 Februari 2026</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-10 space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Informasi yang Kami Kumpulkan</h2>
            <p>Mawana Digital Services ("Kami") mengumpulkan informasi pribadi Anda ketika Anda menggunakan layanan kami melalui situs web mawanads.com. Informasi yang dikumpulkan meliputi:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Data identitas:</strong> Nama lengkap, alamat email, nomor telepon/WhatsApp</li>
              <li><strong>Data bisnis:</strong> Nama perusahaan/organisasi, peran/jabatan</li>
              <li><strong>Data transaksi:</strong> Riwayat pembelian, metode pembayaran, status pembayaran</li>
              <li><strong>Data teknis:</strong> Alamat IP, jenis browser, sistem operasi, data cookies</li>
              <li><strong>Data penggunaan:</strong> Halaman yang dikunjungi, waktu akses, interaksi dengan konten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Cara Kami Menggunakan Informasi</h2>
            <p>Informasi yang dikumpulkan digunakan untuk:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Memproses pendaftaran dan transaksi pembayaran</li>
              <li>Mengirimkan konfirmasi, pengingat, dan informasi terkait layanan</li>
              <li>Memberikan akses ke webinar, pelatihan, dan konten yang dibeli</li>
              <li>Meningkatkan kualitas layanan dan pengalaman pengguna</li>
              <li>Mengirimkan komunikasi pemasaran (dengan persetujuan Anda)</li>
              <li>Memenuhi kewajiban hukum dan regulasi yang berlaku</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Pembagian Informasi kepada Pihak Ketiga</h2>
            <p>Kami dapat membagikan informasi Anda kepada pihak ketiga dalam kondisi berikut:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Pemroses pembayaran:</strong> TriPay sebagai gateway pembayaran untuk memproses transaksi Anda secara aman</li>
              <li><strong>Penyedia layanan:</strong> Pihak ketiga yang membantu operasional kami (hosting, email, analytics)</li>
              <li><strong>Kewajiban hukum:</strong> Jika diwajibkan oleh undang-undang atau proses hukum yang berlaku</li>
            </ul>
            <p className="mt-2">Kami tidak menjual, memperdagangkan, atau menyewakan informasi pribadi Anda kepada pihak lain untuk tujuan pemasaran mereka.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Keamanan Data</h2>
            <p>Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda, termasuk:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Enkripsi data saat transmisi (SSL/TLS)</li>
              <li>Pembatasan akses ke data pribadi hanya untuk personel yang berwenang</li>
              <li>Pemantauan sistem secara berkala terhadap potensi kerentanan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cookies dan Teknologi Pelacakan</h2>
            <p>Situs kami menggunakan cookies dan teknologi pelacakan serupa untuk:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Mengingat preferensi Anda</li>
              <li>Menganalisis lalu lintas dan penggunaan situs</li>
              <li>Mengoptimalkan kampanye iklan (Meta Pixel)</li>
            </ul>
            <p className="mt-2">Anda dapat mengatur browser untuk menolak cookies, namun beberapa fitur situs mungkin tidak berfungsi optimal.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Hak Pengguna</h2>
            <p>Anda memiliki hak untuk:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Mengakses informasi pribadi yang kami simpan tentang Anda</li>
              <li>Meminta perbaikan data yang tidak akurat</li>
              <li>Meminta penghapusan data pribadi Anda (dengan batasan tertentu)</li>
              <li>Menolak pengiriman komunikasi pemasaran</li>
              <li>Meminta portabilitas data</li>
            </ul>
            <p className="mt-2">Untuk menggunakan hak-hak ini, silakan hubungi kami melalui kontak yang tersedia di bawah.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Penyimpanan Data</h2>
            <p>Kami menyimpan informasi pribadi Anda selama diperlukan untuk memenuhi tujuan yang diuraikan dalam kebijakan ini, atau selama diwajibkan oleh hukum yang berlaku. Data transaksi pembayaran disimpan sesuai dengan ketentuan perpajakan dan akuntansi yang berlaku di Indonesia.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Perubahan Kebijakan</h2>
            <p>Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Setiap perubahan akan dipublikasikan di halaman ini dengan tanggal pembaruan yang baru. Kami menyarankan Anda untuk meninjau kebijakan ini secara berkala.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Kontak</h2>
            <p>Untuk pertanyaan atau permintaan terkait kebijakan privasi ini, silakan hubungi:</p>
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

export default KebijakanPrivasi;
