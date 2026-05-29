import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Upload, 
  Trash2, 
  Pencil,
  ImageIcon, 
  Loader2, 
  Plus, 
  Users,
  Calendar,
  UserCheck,
  Building2,
  Landmark,
  FileImage,
  FileText
} from 'lucide-react';

const AdminRecognizedOrgs = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [orgName, setOrgName] = useState('');
  const [adviserName, setAdviserName] = useState('');
  const [dateEstablished, setDateEstablished] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [chartFile, setChartFile] = useState(null);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [currentPdfEntries, setCurrentPdfEntries] = useState([]);

  const queryRecords = useCallback(async () => {
    const { data, error } = await supabase
      .from('recognized-structure')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await queryRecords());
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  }, [queryRecords]);

  useEffect(() => {
    let isMounted = true;

    const loadRecords = async () => {
      try {
        const data = await queryRecords();
        if (isMounted) setRecords(data);
      } catch (err) {
        console.error('Error fetching records:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRecords();

    return () => {
      isMounted = false;
    };
  }, [queryRecords]);

  const handleUpload = async (file, bucket) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'file';
    const fileName = `${bucket}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBaseName}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const handleUploadMany = async (files, bucket) => {
    if (!files.length) return [];

    return Promise.all(
      files.map(async (file) => ({
        name: file.name,
        url: await handleUpload(file, bucket)
      }))
    );
  };

  const getPdfNameFromUrl = (url, fallback = 'Compliance PDF') => {
    if (!url) return fallback;

    try {
      const pathname = new URL(url).pathname;
      const fileName = decodeURIComponent(pathname.split('/').pop() || '');
      return fileName || fallback;
    } catch {
      const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] || '');
      return fileName || fallback;
    }
  };

  const getPdfEntries = (record) => {
    const urls = record.pdf_urls || [];
    const names = record.pdf_names || [];

    if (urls.length > 0) {
      return urls.map((url, index) => ({
        url,
        name: names[index] || getPdfNameFromUrl(url, `Compliance PDF ${index + 1}`)
      }));
    }

    return record.pdf_url ? [{ url: record.pdf_url, name: getPdfNameFromUrl(record.pdf_url) }] : [];
  };

  const resetForm = () => {
    setEditingId(null);
    setOrgName('');
    setAdviserName('');
    setDateEstablished('');
    setLogoFile(null);
    setChartFile(null);
    setPdfFiles([]);
    setCurrentPdfEntries([]);
  };

  const getEstablishedYear = (dateValue) => {
    if (!dateValue) return '';
    const year = new Date(dateValue).getFullYear();
    return Number.isNaN(year) ? '' : String(year);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setOrgName(record.org_name || '');
    setAdviserName(record.adviser_name || '');
    setDateEstablished(getEstablishedYear(record.date_established));
    setLogoFile(null);
    setChartFile(null);
    setPdfFiles([]);
    setCurrentPdfEntries(getPdfEntries(record));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const logoUrl = await handleUpload(logoFile, 'org-logos');
      const chartUrl = await handleUpload(chartFile, 'org-charts');
      const uploadedPdfs = await handleUploadMany(pdfFiles, 'compliance-reports');

      const payload = {
        org_name: orgName,
        adviser_name: adviserName,
        date_established: `${dateEstablished}-01-01`
      };

      if (logoUrl) payload.logo_url = logoUrl;
      if (chartUrl) payload.chart_url = chartUrl;
      if (editingId || uploadedPdfs.length > 0) {
        const allPdfs = [...currentPdfEntries, ...uploadedPdfs];

        payload.pdf_urls = allPdfs.map((file) => file.url);
        payload.pdf_names = allPdfs.map((file) => file.name);
        payload.pdf_url = allPdfs[0]?.url || null;
      }

      const { error } = editingId
        ? await supabase.from('recognized-structure').update(payload).eq('id', editingId)
        : await supabase.from('recognized-structure').insert([{ ...payload, created_at: new Date().toISOString() }]);
      if (error) throw error;

      resetForm();
      await fetchRecords();
      alert(`Organization ${editingId ? 'updated' : 'added'} successfully!`);
    } catch (err) {
      alert(`Operation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this organization record?')) return;
    try {
      await supabase.from('recognized-structure').delete().eq('id', id);
      await fetchRecords();
    } catch {
      alert('Delete failed');
    }
  };

  const withLogoCount = records.filter((record) => record.logo_url).length;
  const withChartCount = records.filter((record) => record.chart_url).length;
  const selectedPdfLabel = pdfFiles.length === 0
    ? editingId
      ? 'Choose PDFs to add'
      : 'No PDFs chosen'
    : pdfFiles.length === 1
      ? pdfFiles[0].name
      : `${pdfFiles.length} PDFs selected`;

  const formatEstablishedDate = (dateValue) => {
    if (!dateValue) return '--';

    return getEstablishedYear(dateValue) || '--';
  };

  return (
    <main className="admin-page mx-auto max-w-[1920px] pb-16 font-outfit text-gray-900">
      <div className="space-y-8">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <span className="inline-flex items-center rounded-md bg-maroon-50 px-3 py-1 text-xs font-semibold text-maroon-800">
            About Section
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
            Recognized Organizations
          </h1>
        </section>

        <section className="space-y-6">
          <aside className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-maroon-50 text-maroon-800">
                  <Building2 size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-950">Organization Overview</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Manage the records used for the public recognized organizations display.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Registered Groups</span>
                  <strong className="mt-3 block text-3xl font-bold text-gray-950">{records.length}</strong>
                  <small className="mt-2 block text-sm leading-6 text-gray-500">
                    Active organization records saved in the recognition registry.
                  </small>
                </div>
                <div className="rounded-lg border border-maroon-100 bg-maroon-50 p-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-maroon-700">Logo Assets</span>
                  <strong className="mt-3 block text-3xl font-bold text-maroon-950">{withLogoCount}</strong>
                  <small className="mt-2 block text-sm leading-6 text-maroon-700/80">
                    Records with uploaded identity logos for public profile cards.
                  </small>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Structure Charts</span>
                  <strong className="mt-3 block text-3xl font-bold text-gray-950">{withChartCount}</strong>
                  <small className="mt-2 block text-sm leading-6 text-gray-500">
                    Uploaded organization charts available for profile viewing.
                  </small>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-base font-bold text-amber-950">Upload Tip</h3>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                Use clear logo files and readable structure charts so public organization profiles stay consistent on every screen.
              </p>
            </div>
          </aside>

          <section className="space-y-6">
            <div>
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-start gap-4 border-b border-gray-200 p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-maroon-50 text-maroon-800">
                    <Plus size={22} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-950">
                      {editingId ? 'Edit Group' : 'Register Group'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {editingId
                        ? 'Update the selected organization record. Existing files stay attached when new PDFs are added.'
                        : 'Add a recognized organization with its adviser, logo, structure chart, and compliance files.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Official Name</label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Science Research Council"
                      className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-maroon-200 focus:ring-4 focus:ring-maroon-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Faculty Lead / Adviser</label>
                    <input
                      type="text"
                      required
                      value={adviserName}
                      onChange={(e) => setAdviserName(e.target.value)}
                      placeholder="Full name of adviser"
                      className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-maroon-200 focus:ring-4 focus:ring-maroon-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Establishment Year</label>
                    <input
                      type="number"
                      required
                      min="1900"
                      max="2099"
                      inputMode="numeric"
                      pattern="[0-9]{4}"
                      value={dateEstablished}
                      onChange={(e) => setDateEstablished(e.target.value)}
                      placeholder="e.g. 2018"
                      className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-maroon-200 focus:ring-4 focus:ring-maroon-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Identity Logo</label>
                      <label className="flex min-h-32 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 transition hover:border-maroon-200 hover:bg-maroon-50/60">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-maroon-800 shadow-sm">
                          <ImageIcon size={18} />
                        </div>
                        <div className="min-w-0 text-left">
                          <span className="block truncate text-sm font-semibold text-gray-700">
                            {logoFile ? logoFile.name : 'No logo chosen'}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-400">PNG, JPG, or WEBP logo image</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Structure Chart</label>
                      <label className="flex min-h-32 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 transition hover:border-maroon-200 hover:bg-maroon-50/60">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-maroon-800 shadow-sm">
                          <Upload size={18} />
                        </div>
                        <div className="min-w-0 text-left">
                          <span className="block truncate text-sm font-semibold text-gray-700">
                            {chartFile ? chartFile.name : 'No chart chosen'}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-400">PNG, JPG, or WEBP structure chart</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setChartFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Compliance Report (PDF)</label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center transition hover:border-maroon-200 hover:bg-maroon-50/60">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-maroon-800 shadow-sm">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="block truncate text-sm font-semibold text-gray-700">
                          {selectedPdfLabel}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-400">Compliance reports, accreditation certificates, or recognition documents (PDF)</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        multiple
                        onChange={(e) => setPdfFiles(Array.from(e.target.files || []))}
                      />
                    </label>
                    {pdfFiles.length > 0 && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {pdfFiles.map((file, index) => (
                          <div key={`${file.name}-${file.lastModified}-${file.size}`} className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-500">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                                <FileText size={16} />
                              </div>
                              <span className="truncate text-[11px] font-semibold leading-4">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPdfFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))}
                              className="shrink-0 text-gray-400 transition hover:text-red-700"
                              aria-label={`Remove ${file.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {currentPdfEntries.length > 0 && (
                      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current attached PDFs</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {currentPdfEntries.map((pdf, index) => (
                            <div
                              key={`${pdf.url}-${index}`}
                              className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600"
                            >
                              <a
                                href={pdf.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-w-0 items-center gap-2 transition hover:text-maroon-800"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                                  <FileText size={16} />
                                </div>
                                <span className="truncate text-[11px] font-semibold leading-4">{pdf.name}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => setCurrentPdfEntries((entries) => entries.filter((_, entryIndex) => entryIndex !== index))}
                                className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-700"
                                aria-label={`Remove ${pdf.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-maroon-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-maroon-900 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={16} /> : editingId ? <Pencil size={16} /> : <Plus size={16} />}
                      {editingId ? 'Update Organization' : 'Add Organization'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div>
              <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-950">Organization Registry</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                      Review registered groups and remove records that should no longer appear on the public page.
                    </p>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-md border border-maroon-100 bg-maroon-50 px-3 py-2 text-sm font-semibold text-maroon-800">
                    <Landmark size={16} />
                    About Section
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
                  {loading ? (
                    [1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="h-80 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
                    ))
                  ) : records.length === 0 ? (
                    <div className="col-span-full rounded-lg border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-white text-gray-300 shadow-sm">
                        <Users size={28} />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-gray-500">The organization registry is currently empty.</p>
                    </div>
                  ) : (
                    records.map((record) => (
                      <article
                        key={record.id}
                        className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-maroon-200 hover:shadow-md"
                      >
                        <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-gray-50">
                          {record.chart_url ? (
                            <img
                              src={record.chart_url}
                              alt={`${record.org_name} structure chart`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-white text-gray-300 shadow-sm">
                                <FileImage size={28} />
                              </div>
                              <p className="mt-3 text-sm font-semibold text-gray-500">No chart uploaded</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col border-t border-gray-100 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50 p-2.5">
                              {record.logo_url ? (
                                <img src={record.logo_url} className="h-full w-full object-contain" alt={`${record.org_name} logo`} />
                              ) : (
                                <Users className="text-gray-300" size={28} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="truncate text-base font-bold text-gray-950">{record.org_name}</h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Established: {formatEstablishedDate(record.date_established)}
                                  </p>
                                </div>
                                <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${record.chart_url ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {record.chart_url ? 'Live' : 'Draft'}
                                </span>
                              </div>

                              <div className="mt-4 space-y-3">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  <div className="flex min-w-0 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                                    <UserCheck size={14} className="shrink-0 text-maroon-800" />
                                    <span className="truncate">{record.adviser_name || 'No adviser'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                                    <Calendar size={14} className="shrink-0 text-maroon-800" />
                                    <span>{formatEstablishedDate(record.date_established)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {getPdfEntries(record).length > 0 && (
                            <div className="mt-4 space-y-2">
                              {getPdfEntries(record).map((pdf, index) => (
                                <a
                                  key={`${pdf.url}-${index}`}
                                  href={pdf.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex min-w-0 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 transition hover:border-maroon-200 hover:bg-maroon-50 hover:text-maroon-800"
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                                    <FileText size={16} />
                                  </div>
                                  <span className="truncate text-[11px] font-semibold leading-4">{pdf.name}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
                            <button
                              type="button"
                              onClick={() => handleEdit(record)}
                              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-maroon-200 hover:bg-maroon-50 hover:text-maroon-800"
                              aria-label={`Edit ${record.org_name}`}
                            >
                              <Pencil size={16} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(record.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                              aria-label={`Delete ${record.org_name}`}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
};

export default AdminRecognizedOrgs;
