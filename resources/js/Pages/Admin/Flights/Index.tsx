import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TimeInput24 from '@/Components/TimeInput24';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Edit, Trash, Plus } from 'lucide-react';
import { appConfirm } from '@/lib/confirm';

export default function Index({ flights, airlines, airports, gates, checkinCounters, baggageClaims }: any) {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        tanggal_penerbangan: new Date().toISOString().split('T')[0],
        nomor_penerbangan: '',
        airline_id: '',
        airport_asal_id: '',
        airport_tujuan_id: '',
        jam_jadwal: '',
        jam_estimasi: '',
        jam_aktual: '',
        jenis_penerbangan: 'departure',
        tipe_layanan: 'domestik',
        gate_id: '',
        checkin_counter_id: '',
        baggage_claim_id: '',
        status: 'Scheduled',
        catatan: '',
    });

    const openModal = (flight: any = null) => {
        if (flight) {
            setEditingId(flight.id);
            setData({
                tanggal_penerbangan: flight.tanggal_penerbangan?.split('T')[0],
                nomor_penerbangan: flight.nomor_penerbangan,
                airline_id: flight.airline_id,
                airport_asal_id: flight.airport_asal_id,
                airport_tujuan_id: flight.airport_tujuan_id,
                jam_jadwal: flight.jam_jadwal,
                jam_estimasi: flight.jam_estimasi || '',
                jam_aktual: flight.jam_aktual || '',
                jenis_penerbangan: flight.jenis_penerbangan,
                tipe_layanan: flight.tipe_layanan,
                gate_id: flight.gate_id || '',
                checkin_counter_id: flight.checkin_counter_id || '',
                baggage_claim_id: flight.baggage_claim_id || '',
                status: flight.status,
                catatan: flight.catatan || '',
            });
        } else {
            setEditingId(null);
            reset();
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(route('admin.flights.update', editingId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.flights.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const deleteFlight = async (id: number) => {
        const ok = await appConfirm({
            variant: 'danger',
            title: 'Hapus Penerbangan',
            message: 'Apakah Anda yakin ingin menghapus penerbangan ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal',
        });
        if (!ok) return;
        destroy(route('admin.flights.destroy', id));
    };

    // Helper to find names
    const getAirlineName = (id: number) => airlines.find((a: any) => a.id === id)?.nama_maskapai || '-';
    const getAirportCode = (id: number) => airports.find((a: any) => a.id === id)?.kode_iata || '-';
    
    const formatTanggal = (value: string | null | undefined) => {
        if (!value) return '-';
        return value.split('T')[0];
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Jadwal Penerbangan
                </h2>
            }
        >
            <Head title="Jadwal Penerbangan" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Daftar Jadwal</h3>
                            <button
                                onClick={() => openModal()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center text-sm"
                            >
                                <Plus size={16} className="mr-1" /> Tambah Jadwal
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b dark:border-gray-700 text-gray-600 dark:text-gray-300">
                                        <th className="py-3 px-2">Tanggal</th>
                                        <th className="py-3 px-2">Waktu</th>
                                        <th className="py-3 px-2">Penerbangan</th>
                                        <th className="py-3 px-2">Rute</th>
                                        <th className="py-3 px-2">Jenis</th>
                                        <th className="py-3 px-2">Status</th>
                                        <th className="py-3 px-2 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flights.data.map((flight: any) => (
                                        <tr key={flight.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200">
                                            <td className="py-3 px-2 whitespace-nowrap">{formatTanggal(flight.tanggal_penerbangan)}</td>
                                            <td className="py-3 px-2 whitespace-nowrap font-medium">{flight.jam_jadwal.substring(0,5)}</td>
                                            <td className="py-3 px-2">
                                                <div className="font-semibold text-blue-600 dark:text-blue-400">{flight.nomor_penerbangan}</div>
                                                <div className="text-xs text-gray-500">{flight.airline?.nama_maskapai}</div>
                                            </td>
                                            <td className="py-3 px-2 whitespace-nowrap">
                                                {flight.airport_asal?.kode_iata} &rarr; {flight.airport_tujuan?.kode_iata}
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${flight.jenis_penerbangan === 'departure' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}`}>
                                                    {flight.jenis_penerbangan.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 font-semibold">
                                                {flight.status}
                                            </td>
                                            <td className="py-3 px-2 text-right space-x-2 whitespace-nowrap">
                                                <button onClick={() => openModal(flight)} className="text-blue-600 hover:text-blue-800">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => deleteFlight(flight.id)} className="text-red-600 hover:text-red-800">
                                                    <Trash size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {flights.data.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-6 text-center text-gray-500">
                                                Belum ada jadwal penerbangan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                            {editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}
                        </h3>
                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Kiri */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tgl Penerbangan</label>
                                    <input type="date" value={data.tanggal_penerbangan} onChange={e => setData('tanggal_penerbangan', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Penerbangan</label>
                                    <input type="text" placeholder="e.g. GA-123" value={data.nomor_penerbangan} onChange={e => setData('nomor_penerbangan', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Maskapai</label>
                                    <select value={data.airline_id} onChange={e => setData('airline_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required>
                                        <option value="">Pilih Maskapai</option>
                                        {airlines.map((a: any) => <option key={a.id} value={a.id}>{a.nama_maskapai}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-1/2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asal</label>
                                        <select value={data.airport_asal_id} onChange={e => setData('airport_asal_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required>
                                            <option value="">Pilih Asal</option>
                                            {airports.map((a: any) => <option key={a.id} value={a.id}>{a.nama_bandara} ({a.kode_iata})</option>)}
                                        </select>
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tujuan</label>
                                        <select value={data.airport_tujuan_id} onChange={e => setData('airport_tujuan_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required>
                                            <option value="">Pilih Tujuan</option>
                                            {airports.map((a: any) => <option key={a.id} value={a.id}>{a.nama_bandara} ({a.kode_iata})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-1/2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jenis</label>
                                        <select value={data.jenis_penerbangan} onChange={e => setData('jenis_penerbangan', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required>
                                            <option value="departure">Keberangkatan</option>
                                            <option value="arrival">Kedatangan</option>
                                        </select>
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Layanan</label>
                                        <select value={data.tipe_layanan} onChange={e => setData('tipe_layanan', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white" required>
                                            <option value="domestik">Domestik</option>
                                            <option value="internasional">Internasional</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Kanan */}
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jadwal</label>
                                        <TimeInput24 value={data.jam_jadwal} onChange={v => setData('jam_jadwal', v)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-2 py-1" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimasi</label>
                                        <TimeInput24 value={data.jam_estimasi} onChange={v => setData('jam_estimasi', v)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-2 py-1" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aktual</label>
                                        <TimeInput24 value={data.jam_aktual} onChange={v => setData('jam_aktual', v)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-2 py-1" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    <select value={data.status} onChange={e => setData('status', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white font-semibold" required>
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Check-in Open">Check-in Open</option>
                                        <option value="Check-in Closed">Check-in Closed</option>
                                        <option value="Boarding">Boarding</option>
                                        <option value="Final Call">Final Call</option>
                                        <option value="Departed">Departed</option>
                                        <option value="Arrived">Arrived</option>
                                        <option value="Delayed">Delayed</option>
                                        <option value="Cancelled">Cancelled</option>
                                        <option value="Gate Open">Gate Open</option>
                                        <option value="Baggage Claim">Baggage Claim</option>
                                        <option value="On Time">On Time</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gate</label>
                                    <select value={data.gate_id} onChange={e => setData('gate_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                                        <option value="">- Tidak Ada -</option>
                                        {gates.map((a: any) => <option key={a.id} value={a.id}>{a.nama_gate}</option>)}
                                    </select>
                                </div>

                                {data.jenis_penerbangan === 'departure' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check-in Counter</label>
                                        <select value={data.checkin_counter_id} onChange={e => setData('checkin_counter_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                                            <option value="">- Tidak Ada -</option>
                                            {checkinCounters.map((a: any) => <option key={a.id} value={a.id}>Counter {a.nomor_counter}</option>)}
                                        </select>
                                    </div>
                                )}

                                {data.jenis_penerbangan === 'arrival' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Baggage Claim</label>
                                        <select value={data.baggage_claim_id} onChange={e => setData('baggage_claim_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                                            <option value="">- Tidak Ada -</option>
                                            {baggageClaims.map((a: any) => <option key={a.id} value={a.id}>Belt {a.nomor_belt}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
